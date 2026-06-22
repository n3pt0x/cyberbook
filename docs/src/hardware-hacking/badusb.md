---
title: "BadUSB"
---

# 🔌 BadUSB

## 📚 Resources

- [BadUSB Docs](https://docs.spacehuhn.com/badusb/)
- [Hak5 Rubber Ducky Documentation](https://documentation.hak5.org/hak5-usb-rubber-ducky)

## 📟 Digispark Attiny85

### ⚙️ Setup (udev)

::: details

For the Digispark to be recognized under Linux, you need an udev rule.

**1. Create the file**

```bash
wget https://raw.githubusercontent.com/micronucleus/micronucleus/master/commandline/49-micronucleus.rules -O /etc/udev/rules.d/49-micronucleus.rules
```

**2. Reload the rules:**

```bash
sudo udevadm control --reload-rules
```

:::

### 🛠️ Tools

#### Online Converters

- [Duckify](https://duckify.spacehuhn.com/) - DuckyScript to Digispark/Arduino ([GitHub](https://github.com/spacehuhntech/duckify))
- [PayloadStudio](https://payloadstudio.hak5.org/community/) - Official Hak5 DuckyScript compiler (generates `.bin`)

### </> CLI Tools

```bash
# Clone duckencoder.py (Python 2)
git clone https://github.com/mame82/duckencoder.py.git
cd duckencoder.py

# Get duck2spark
wget https://raw.githubusercontent.com/mame82/duck2spark/refs/heads/master/duck2spark.py
```

#### Encoding a Payload

```bash
# Encode DuckyScript to .bin
cat script.txt | python2 duckencoder.py -p -l fr > payload.bin

# Convert .bin to .ino (Arduino sketch)
python2 duck2spark.py -i payload.bin -l 1 -f 2000 -o sketch.ino
```

### 💾 Memory Management (PROGMEM)

- [DigiKeyboard Library](https://github.com/ArminJo/DigistumpArduino/blob/master/package_digistump_index.json)
- [DigisparkKeyboard keylayouts.h](https://github.com/ArminJo/DigistumpArduino/blob/master/digistump-avr/libraries/DigisparkKeyboard/keylayouts.h)

RAM vs Flash

- RAM: 512 bytes (variables, strings)
- Flash: 6.6 KB (code, constants)

Use `PROGMEM` to store long strings in Flash, not RAM.

::: details Arduino `payload.cpp`

```cpp
#include "DigiKeyboard.h"

// hello
const uint8_t payload[] PROGMEM = {0x00, 0x0B, 0x00, 0x08, 0x00, 0x0F, 0x00, 0x0F, 0x00, 0x12};

void duckyString(const uint8_t* keys, size_t len) {
    for(size_t i=0; i < len; i+=2) {
        DigiKeyboard.sendKeyStroke(
            pgm_read_byte_near(keys + i+1),
            pgm_read_byte_near(keys + i));
    }
}

void setup() {
  DigiKeyboard.delay(2000);
  duckyString(payload, sizeof(payload));
  DigiKeyboard.sendKeyStroke(40, 0); // ENTER
}

void loop() {}
```

:::

## 🌸 Adafruit Trinkey QT2040

- [USBNova (Adafruit Trinkey QT2040)](https://docs.spacehuhn.com/usbnova/) - Full documentation

Based on USBNova make by `spacehuhn`

### ⚙️ Setup

- [USBNova](https://github.com/SpacehuhnTech/USBNova/releases) - Firmware

**1. Flash firmware**

Plug the Adafruit **while holding the BOOT button**.

**2. Copy the firmware**

```bash
sudo mount /dev/sdX1 /mnt
wget https://github.com/SpacehuhnTech/USBNova/releases/download/1.2.3/USBNova_diy_trinkey_1.2.3.uf2 -O /mnt/USBNova_diy_trinkey_1.2.3.uf2
sud umount /mnt && sudo eject /dev/sdX
```

**3. Setup the script**

Unplug and Trinkey without pressing the BOOT button. A new volume (e.g., `/dev/sdX`) should appear.

```bash
sudo mount /dev/sdx /mnt

ls /mnt
# main_script.txt  preferences.json
```

The firmware use DuckyScript, check [documentation (basics usage)](https://docs.spacehuhn.com/usbnova/usage/basics/) for more details.

```bash
# main.script
GUI r
DELAY 500
STRING hello
DELAY 100
ENTER
```

**4. Run payload**

Press the BOOT button for 1 second. The red LED should turn ON, and the payload will execute.
