#!/bin/bash

echo "🔍 Searching for smart scale on your network..."
echo "Router: 192.168.1.1"
echo ""

# Get current devices
echo "Current devices on network:"
arp -a | grep 192.168.1 | while read line; do
    ip=$(echo $line | cut -d'(' -f2 | cut -d')' -f1)
    mac=$(echo $line | awk '{print $4}')

    # Check if MAC matches known scale manufacturers
    case "${mac:0:8}" in
        "00:24:e4"|"00:25:e5"|"ac:9a:22"|"f0:4f:7c")
            echo "🎯 Possible Withings/Nokia scale: $ip ($mac)"
            ;;
        "c0:3d:d0"|"d0:3d:c0")
            echo "🎯 Possible Garmin device: $ip ($mac)"
            ;;
        "34:d2:70"|"54:4a:16"|"88:4a:ea")
            echo "🎯 Possible Xiaomi/Mi scale: $ip ($mac)"
            ;;
        "a4:c1:38")
            echo "🎯 Possible Eufy scale: $ip ($mac)"
            ;;
        *)
            echo "   $ip - $mac"
            ;;
    esac
done

echo ""
echo "To identify your scale:"
echo "1. Note the devices above"
echo "2. Turn your scale off/on or weigh yourself"
echo "3. Run this script again to see new devices"
echo ""
echo "Once you find your scale's IP, monitor it with:"
echo "sudo tcpdump -i en0 -A host <scale_ip>"