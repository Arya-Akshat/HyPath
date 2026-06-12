#include "ns3/core-module.h"
#include "ns3/network-module.h"
#include "ns3/internet-module.h"
#include "ns3/point-to-point-module.h"
#include "ns3/applications-module.h"
#include <iostream>
#include <string>

using namespace ns3;

uint32_t g_droppedPackets = 0;

void RxDropCallback (Ptr<const Packet> packet)
{
  g_droppedPackets++;
}

int main (int argc, char *argv[])
{
  std::string scenario = "moderate";
  std::string protocol = "UDP";
  uint32_t packets = 100;
  uint32_t packetSize = 1460;
  double pacingDelay = 0.05;

  CommandLine cmd (__FILE__);
  cmd.AddValue ("scenario", "Scenario to run", scenario);
  cmd.AddValue ("protocol", "Protocol to run (TCP or UDP)", protocol);
  cmd.AddValue ("packets", "Number of packets to send", packets);
  cmd.Parse (argc, argv);

  // Scenario configurations
  std::string bandwidth = "50Mbps";
  std::string latency = "50ms";
  double lossRate = 0.02;

  if (scenario == "ideal") {
    bandwidth = "1000Mbps"; latency = "1ms"; lossRate = 0.0;
  } else if (scenario == "good") {
    bandwidth = "100Mbps"; latency = "10ms"; lossRate = 0.001;
  } else if (scenario == "moderate") {
    bandwidth = "50Mbps"; latency = "50ms"; lossRate = 0.02;
  } else if (scenario == "poor") {
    bandwidth = "10Mbps"; latency = "150ms"; lossRate = 0.05;
  } else if (scenario == "terrible") {
    bandwidth = "1Mbps"; latency = "300ms"; lossRate = 0.15;
  } else if (scenario == "drone_telemetry") {
    bandwidth = "20Mbps"; latency = "80ms"; lossRate = 0.03;
  } else if (scenario == "live_streaming") {
    bandwidth = "50Mbps"; latency = "30ms"; lossRate = 0.01;
  } else if (scenario == "industrial_iot") {
    bandwidth = "5Mbps"; latency = "100ms"; lossRate = 0.04;
  } else if (scenario == "disaster_response") {
    bandwidth = "2Mbps"; latency = "200ms"; lossRate = 0.10;
  }

  std::cout << "--- Running ns-3 Verification ---" << std::endl;
  std::cout << "Scenario:  " << scenario << std::endl;
  std::cout << "Protocol:  " << protocol << std::endl;
  std::cout << "Bandwidth: " << bandwidth << std::endl;
  std::cout << "Latency:   " << latency << std::endl;
  std::cout << "Loss Rate: " << lossRate * 100 << "%" << std::endl;
  std::cout << "Packets:   " << packets << std::endl << std::endl;

  // 1. Create Nodes
  NodeContainer nodes;
  nodes.Create (2);

  // 2. Setup Point-to-Point Link
  PointToPointHelper pointToPoint;
  pointToPoint.SetDeviceAttribute ("DataRate", StringValue (bandwidth));
  pointToPoint.SetChannelAttribute ("Delay", StringValue (latency));

  // 3. Install devices
  NetDeviceContainer devices;
  devices = pointToPoint.Install (nodes);

  // 4. Inject Packet Loss on Receiver
  if (lossRate > 0) {
    Ptr<RateErrorModel> em = CreateObject<RateErrorModel> ();
    em->SetAttribute ("ErrorRate", DoubleValue (lossRate));
    em->SetAttribute ("ErrorUnit", EnumValue (RateErrorModel::ERROR_UNIT_PACKET));
    devices.Get (1)->SetAttribute ("ReceiveErrorModel", PointerValue (em));
    devices.Get (1)->TraceConnectWithoutContext ("PhyRxDrop", MakeCallback (&RxDropCallback));
  }

  // 5. Install Internet Stack
  InternetStackHelper stack;
  stack.Install (nodes);

  // 6. Assign IP Addresses
  Ipv4AddressHelper address;
  address.SetBase ("10.1.1.0", "255.255.255.0");
  Ipv4InterfaceContainer interfaces = address.Assign (devices);

  Ipv4Address serverIp = interfaces.GetAddress (1);

  Ptr<Application> clientApp;
  Ptr<Application> serverApp;

  // 7. Configure Traffic & Applications
  if (protocol == "UDP" || protocol == "udp") {
    uint16_t port = 9;
    // UDP Server on Node 1
    UdpServerHelper server (port);
    ApplicationContainer serverApps = server.Install (nodes.Get (1));
    serverApp = serverApps.Get (0);
    serverApps.Start (Seconds (1.0));
    serverApps.Stop (Seconds (2000.0));

    // UDP Client on Node 0
    UdpClientHelper client (serverIp, port);
    client.SetAttribute ("MaxPackets", UintegerValue (packets));
    client.SetAttribute ("Interval", TimeValue (Seconds (pacingDelay)));
    client.SetAttribute ("PacketSize", UintegerValue (packetSize));
    
    ApplicationContainer clientApps = client.Install (nodes.Get (0));
    clientApp = clientApps.Get (0);
    clientApps.Start (Seconds (2.0));
    clientApps.Stop (Seconds (2000.0));
  }
  else { // TCP
    uint16_t port = 8080;
    // TCP Sink on Node 1
    PacketSinkHelper server ("ns3::TcpSocketFactory", InetSocketAddress (Ipv4Address::GetAny (), port));
    ApplicationContainer serverApps = server.Install (nodes.Get (1));
    serverApp = serverApps.Get (0);
    serverApps.Start (Seconds (1.0));
    serverApps.Stop (Seconds (2000.0));

    // TCP BulkSend on Node 0
    uint32_t totalBytes = packets * packetSize;
    BulkSendHelper client ("ns3::TcpSocketFactory", InetSocketAddress (serverIp, port));
    client.SetAttribute ("MaxBytes", UintegerValue (totalBytes));
    
    ApplicationContainer clientApps = client.Install (nodes.Get (0));
    clientApp = clientApps.Get (0);
    clientApps.Start (Seconds (2.0));
    clientApps.Stop (Seconds (2000.0));
  }

  // 8. Run Simulation
  Simulator::Stop (Seconds (2001.0));
  Simulator::Run ();

  // 9. Extract and Print Simulation Results
  std::cout << "--- Simulation Completed ---" << std::endl;
  if (protocol == "UDP" || protocol == "udp") {
    Ptr<UdpServer> udpServer = DynamicCast<UdpServer> (serverApp);
    uint32_t rxPackets = udpServer->GetReceived ();
    uint32_t lostPackets = packets - rxPackets;
    double deliveryRatio = (packets > 0) ? ((double)rxPackets / packets) * 100.0 : 0.0;
    std::cout << "UDP Packets Sent:      " << packets << std::endl;
    std::cout << "UDP Packets Received:  " << rxPackets << std::endl;
    std::cout << "UDP Packets Lost:      " << lostPackets << std::endl;
    std::cout << "Delivery Ratio:        " << deliveryRatio << "%" << std::endl;
  }
  else {
    Ptr<PacketSink> tcpSink = DynamicCast<PacketSink> (serverApp);
    uint64_t bytesReceived = tcpSink->GetTotalRx ();
    uint64_t packetsReceived = bytesReceived / packetSize;
    std::cout << "TCP Bytes Received:    " << bytesReceived << " bytes" << std::endl;
    std::cout << "Est. Packets Received: " << packetsReceived << std::endl;
    std::cout << "TCP Retransmissions:  " << g_droppedPackets << std::endl;
  }

  Simulator::Destroy ();
  return 0;
}
