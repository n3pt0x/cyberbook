# XOR (Exclusive OR)

## Tools

- [xortool](https://github.com/hellman/xortool)
- [unxor](https://github.com/tomchop/unxor)
- [Cyberchef](https://cyberchef.io)

## Introduction

### Truth table

#### XOR (Exclusive OR) works like this:

- **`0 XOR 0 = 0`**
- **`0 XOR 1 = 1`**
- **`1 XOR 0 = 1`**
- **`1 XOR 1 = 0`**

#### AND

```plaintext
0 0 | 0
0 1 | 0
1 0 | 0
1 1 | 1
```

#### OR

```plaintext
0 0 | 0
0 1 | 1
1 0 | 1
1 1 | 1
```

## Important Properties:

- **Commutativity**: `A XOR B = B XOR A`
- **Associativity**: `(A XOR B) XOR C = A XOR (B XOR C)`
- **Inversibility**: `A XOR (A XOR B) = B`

## Recovering a Weak Key with XOR

### CASE 1: When You Have Both the Plaintext and the Encrypted File

#### 1. Preparing the File

Convert the file into hexadecimal format. For example, a text file containing the message:

`Hello world, this is my secret message. No body must read this message because it's very secret !`.

#### 2. Example with a Text File:

Original text (`ASCII`) in hex:

```r
54 68 69 73 20 69 73 20 61 20 6c 61 72 67 65 72 20 65 78 61 6d 70 6c 65 20 74 6f 20 74 65 73 74 20 58 4f 52 20 65 6e 63 72 79 70 74 69 6f 6e 2e 20 57 65 20 6e 65 65 64 20 74 6f 20 6f 62 73 65 72 76 65 20 74 68 65 20 72 65 70 65 61 74 69 6e 67 20 70 61 74 74 65 72 6e 73 20 6f 66 20 74 68 65 20 6b 65 79 20 6d 6f 72 65 20 63 6c 65 61 72 6c 79 2e
```

Now suppose this text is XORed with a 3-byte key **`"key"`** (in hex: **`6B 65 79`**).

After the XOR operation, you get the following encrypted hex data:

```r
3f 0d 10 18 45 10 18 45 18 4b 09 18 19 02 1c 19 45 1c 13 04 14 1b 09 1c 4b 11 16 4b 11 1c 18 11 59 33 2a 2b 4b 00 17 08 17 00 1b 11 10 04 0b 57 4b 32 1c 4b 0b 1c 0e 01 59 1f 0a 59 04 07 0a 0e 17 0f 0e 45 0d 03 00 59 19 00 09 0e 04 0d 02 0b 1e 4b 15 18 1f 11 1c 19 0b 0a 4b 0a 1f 4b 11 11 0e 45 12 0e 1c 59 06 0a 0b 0e 45 1a 07 00 18 19 09 00 45
```

#### 3. Recovering the Key

In this case, since you have both the plaintext and the encrypted text, you can use the XOR operation to recover the key. Take the known plaintext and XOR it with the corresponding ciphertext to find the key.

Example:

`0x3F` **XOR** `0x54` = `0x6B`

```r
0x3F = 1 1 1 1 1 1 1 0
0x54 = 0 1 0 1 0 1 0 0
       ---------------
0x6B = 1 0 1 0 1 0 1 0
```

`0x0D` **XOR** `0x68` = `0x65`

```r
0x0D XOR 0x68 = 0x65
```

`0x10` **XOR** `0x69` = `0x79`

```r
0x10 XOR 0x69 = 0x79
```

#### 4. Conclusion

The key is "`key`" (`0x6B 0x65 0x79`). By identifying repeating patterns and using XOR to compare the ciphertext and plaintext, the key is recovered.

### Case 2: When You Only Have the Encrypted File (Ciphertext)

1. **Identifying Repeating Patterns**

Look for repeating byte patterns in the ciphertext. This can hint at the key length. Common bytes like `0x45`, `0x4B`, and `0x59` may appear often.

2. **Recovering the Key**

To recover the key, XOR the repeating values with likely plaintext guesses.

In this case, we notice frequent appearances of:

- `0x59` (ASCII `Y`)

- `0x4B` (ASCII `K`)

- `0x45` (ASCII `E`)

These repeating values suggest parts of the key.
