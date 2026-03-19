# 💥 ZIP Weakness

## 📚 Resources

- [Known-plaintext attack](https://en.wikipedia.org/wiki/Known-plaintext_attack)
- [Break encrypted archive](https://www.acceis.fr/craquage-darchives-chiffrees-pkzip-zip-zipcrypto-winzip-zip-aes-7-zip-rar/)
- [How to do a ZipCrypto plaintext attack](https://wiki.anter.dev/misc/plaintext-attack-zipcrypto/)

## 📝 Known plaintext Attack

```bash
Method = ZipCrypto Store # data has store in clear text
```

Files encrypted with the ZipCrypto Store method are vulnerable. We will use the data contained in the file to retrieve the key.

If the file contained in the archive is a well-known file such as `jquery.min.js`, we can find its original plaintext content on the internet. This creates a significant weakness.

```bash
# pkcrack
pkcrack -C step3.zip -c
"step3/suspected_website/js/vendor/jquery.1.11.min.js" -P a.zip -p
"jquery.1.11.min.js" -d decrypted.zip -a
```

### 🏷️ MIME Type header file

For this, we can use magic bytes, since we can read the filenames inside ZIP archives using 7z or unzip, allowing us to determine the file extensions.

Magic bytes must be chosen carefully. For PNG, the following bytes are present in the header. For JPG, we cannot rely on the bytes that follow, as they are not strictly part of the signature anymore.

```bash
# Magic JPG Bytes : ff d8 ff e0 00 10 4a 46 49 46 00 01 01 (13 bytes)
# or remove 1 bytes for safety
echo -ne '\xff\xd8\xff\xe0\x00\x10\x4a\x46\x49\x46\x00\x01\x01' > jpg_header.bin

# PNG
echo -ne '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D' > png_header.bin
```

```bash
# bkcrack
bkcrack -C zip.zip -c 1.jpg -p jpg_header.bin # image encrypt with ZipCrypto Store

> Key founded : xxxxxxxx xxxxxxxx xxxxxxxx
```

#### 🔎 CRC32 in a ZIP Archive

CRC32 (Cyclic Redundancy Check) is a 4-byte checksum computed on the original uncompressed file data.

It is stored in:

- The local file header
- The central directory
- Sometimes in a data descriptor (depending on ZIP flags)

Its purpose is to verify data integrity after extraction.

```bash
# bkcrack
7z l -slt ch73.zip | grep -i -A 10 "cat2.jpg"
> CRC = CA4F0BEE # C4 is -1 offset
```

```bash
# use offset jpeg
echo "ffd8ffe000104a46494600010101004800480000FFDB004300" | xxd -r -p > jpg_header.bin
bkcrack -C ch73.zip -c cat1.jpg -p jpg_header3.bin -x -1 CA
```

### 🔑 Master Key cracking

```bash
# We can get file with key
bkcrack -C zip.zip -k xxxxxxxx xxxxxxxx xxxxxxxx -c passwd.png -d passwd.png

# We can try to retrieved password
bkcrack -k xxxxxxxx xxxxxxxx xxxxxxxx -r 13 ?p

# Or we can recreate the archive (The best way)
bkcrack -C zip.zip -k xxxxxxxx xxxxxxxx xxxxxxx -D uncrypted.zip
bkcrack -C zip.zip -k xxxxxxxx xxxxxxxx xxxxxxx -U uncrypted.zip <password> # encrypted with a new password
```

```bash
# hashcat
echo 'xxxxxxxxxxxxxxxxxxxxxxxx' > hash_pkzip
hashcat -a 0 -m 20500 -g 100 hash_pkzip rockyou.txt
```

## 💥 Brute Force

```bash
# fcrackzip
fcrackzip -u -v -D -p rockyou.txt zip.zip
```

```bash
# john
zip2john zip.zip > zip_hash
john --wordlist=rockyou.txt zip_hash
```

```bash
# hashcat
zip2john ch73.zip | cut -d':' -f2 > hashcat_pkzip
hashcat -m 17225 -a 0 -g 100 hashcat_pkzip rockyou.txt # multi mixed (there are : png, txt)
```
