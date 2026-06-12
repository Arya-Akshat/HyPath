#!/usr/bin/env python3
"""
ns-3 base comparison script to verify simulator performance metrics.
This script models the point-to-point topology with scenario impairments
(latency, loss, bandwidth) and measures TCP/UDP throughput and packet delivery.

Usage (within ns-3 environment):
    ./ns3 run "scripts/ns3_compare.py --scenario=moderate --protocol=UDP --packets=100"
"""

import sys

try:
    from ns import ns
except ImportError:
    print("Error: ns-3 Python bindings ('ns' module) not found.")
    print("Please run this script inside your ns-3 directory structure (e.g., in scratch/ directory)")
    print("Example: ./ns3 run scratch/ns3_compare.py")
    sys.exit(1)

def run_simulation(scenario_name, protocol, packet_count, packet_size=1460, pacing_delay=0.05):
    # Scenario configurations matching our simulator
    scenarios = {
        "ideal": {"latency": "1ms", "loss": 0.0, "bandwidth": "1000Mbps"},
        "good": {"latency": "10ms", "loss": 0.001, "bandwidth": "100Mbps"},
        "moderate": {"latency": "50ms", "loss": 0.02, "bandwidth": "50Mbps"},
        "poor": {"latency": "150ms", "loss": 0.05, "bandwidth": "10Mbps"},
        "terrible": {"latency": "300ms", "loss": 0.15, "bandwidth": "1Mbps"},
        "drone_telemetry": {"latency": "80ms", "loss": 0.03, "bandwidth": "20Mbps"},
        "live_streaming": {"latency": "30ms", "loss": 0.01, "bandwidth": "50Mbps"},
        "industrial_iot": {"latency": "100ms", "loss": 0.04, "bandwidth": "5Mbps"},
        "disaster_response": {"latency": "200ms", "loss": 0.10, "bandwidth": "2Mbps"}
    }
    
    cfg = scenarios.get(scenario_name, scenarios["moderate"])
    
    print(f"--- Running ns-3 Verification ---")
    print(f"Scenario:  {scenario_name}")
    print(f"Protocol:  {protocol}")
    print(f"Bandwidth: {cfg['bandwidth']}")
    print(f"Latency:   {cfg['latency']}")
    print(f"Loss Rate: {cfg['loss']*100}%")
    print(f"Packets:   {packet_count}\n")

    # 1. Create Nodes
    nodes = ns.network.NodeContainer()
    nodes.Create(2)

    # 2. Setup Point-to-Point Link
    pointToPoint = ns.point_to_point.PointToPointHelper()
    pointToPoint.SetDeviceAttribute("DataRate", ns.core.StringValue(cfg["bandwidth"]))
    pointToPoint.SetChannelAttribute("Delay", ns.core.StringValue(cfg["latency"]))

    # 3. Install network interfaces
    devices = pointToPoint.Install(nodes)

    # 4. Inject Packet Loss (Error Model on Receiver)
    if cfg["loss"] > 0:
        em = ns.network.RateErrorModel()
        em.SetAttribute("ErrorRate", ns.core.DoubleValue(cfg["loss"]))
        em.SetAttribute("ErrorUnit", ns.core.EnumValue(ns.network.RateErrorModel.ERROR_UNIT_PACKET))
        devices.Get(1).SetAttribute("ReceiveErrorModel", ns.core.PointerValue(em))

    # 5. Install Internet Stack
    stack = ns.internet.InternetStackHelper()
    stack.Install(nodes)

    # 6. Assign IP Addresses
    address = ns.internet.Ipv4AddressHelper()
    address.SetBase(ns.network.Ipv4Address("10.1.1.0"), ns.network.Ipv4Mask("255.255.255.0"))
    interfaces = address.Assign(devices)

    server_ip = interfaces.GetAddress(1)

    # 7. Configure Traffic & Applications
    if protocol.upper() == "UDP":
        port = 9
        # UDP Server on Node 1
        server = ns.applications.UdpServerHelper(port)
        serverApps = server.Install(nodes.Get(1))
        serverApps.Start(ns.core.Seconds(1.0))
        serverApps.Stop(ns.core.Seconds(20.0))

        # UDP Client on Node 0
        client = ns.applications.UdpClientHelper(server_ip, port)
        client.SetAttribute("MaxPackets", ns.core.UintegerValue(packet_count))
        client.SetAttribute("Interval", ns.core.TimeValue(ns.core.Seconds(pacing_delay)))
        client.SetAttribute("PacketSize", ns.core.UintegerValue(packet_size))
        
        clientApps = client.Install(nodes.Get(0))
        clientApps.Start(ns.core.Seconds(2.0))
        clientApps.Stop(ns.core.Seconds(20.0))
        
    else:  # TCP
        port = 8080
        # TCP Server (Sink) on Node 1
        server = ns.applications.PacketSinkHelper(
            "ns3::TcpSocketFactory",
            ns.network.InetSocketAddress(ns.network.Ipv4Address.GetAny(), port)
        )
        serverApps = server.Install(nodes.Get(1))
        serverApps.Start(ns.core.Seconds(1.0))
        serverApps.Stop(ns.core.Seconds(20.0))

        # TCP Client (Bulk Sender) on Node 0
        # Note: BulkSend sends continuously. To pace or limit packet counts,
        # we configure maximum bytes to send.
        total_bytes = packet_count * packet_size
        client = ns.applications.BulkSendHelper(
            "ns3::TcpSocketFactory",
            ns.network.InetSocketAddress(server_ip, port)
        )
        client.SetAttribute("MaxBytes", ns.core.UintegerValue(total_bytes))
        
        clientApps = client.Install(nodes.Get(0))
        clientApps.Start(ns.core.Seconds(2.0))
        clientApps.Stop(ns.core.Seconds(20.0))

    # 8. Run Simulation
    ns.core.Simulator.Stop(ns.core.Seconds(21.0))
    ns.core.Simulator.Run()

    # 9. Extract and Print Simulation Results
    print("--- Simulation Completed ---")
    if protocol.upper() == "UDP":
        rx_packets = serverApps.Get(0).GetReceived()
        lost_packets = packet_count - rx_packets
        delivery_ratio = (rx_packets / packet_count) * 100 if packet_count > 0 else 0
        print(f"UDP Packets Sent:      {packet_count}")
        print(f"UDP Packets Received:  {rx_packets}")
        print(f"UDP Packets Lost:      {lost_packets}")
        print(f"Delivery Ratio:        {delivery_ratio:.2f}%")
    else:
        bytes_received = serverApps.Get(0).GetTotalRx()
        packets_received = bytes_received // packet_size
        print(f"TCP Bytes Received:    {bytes_received} bytes")
        print(f"Est. Packets Received: {packets_received}")
        
    ns.core.Simulator.Destroy()

if __name__ == "__main__":
    # Setup simple argument parsing via ns-3 command line
    cmd = ns.core.CommandLine()
    
    scenario = "moderate"
    protocol = "UDP"
    packets = 100
    
    cmd.AddValue("scenario", "Scenario to run (ideal, good, moderate, poor, terrible, etc.)", scenario)
    cmd.AddValue("protocol", "Protocol to run (TCP or UDP)", protocol)
    cmd.AddValue("packets", "Number of packets to send", str(packets))
    
    cmd.Parse(sys.argv)
    
    # Extract values back
    scenario_val = cmd.GetExtraValue("scenario") if cmd.GetExtraValue("scenario") else scenario
    protocol_val = cmd.GetExtraValue("protocol") if cmd.GetExtraValue("protocol") else protocol
    packets_val = int(cmd.GetExtraValue("packets")) if cmd.GetExtraValue("packets") else packets
    
    run_simulation(scenario_val, protocol_val, packets_val)
