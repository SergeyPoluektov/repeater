/**
 * Created by spolu on 02.06.2016.
 */

class CodecOmnicomm {
    constructor() {
        this._ESC_BYTE = 0xDB;
        this._ESC_SYN_BYTE = 0xDC;
        this._ESC_ESC_BYTE = 0xDD;
        this._SYN_BYTE = 0xC0;
    }

    encode(rawData) {
        rawData = Array.prototype.slice.apply(rawData);
        //change all 0xC0 and 0xDB bytes in sequence to escape sequence
        //for this bytes
        for (let i = 0; i < rawData.length; i++) {
            if (rawData[i] === this._SYN_BYTE) {
                rawData.splice(i, 1, this._ESC_BYTE, this._ESC_SYN_BYTE);

            } else if (rawData[i] === this._ESC_BYTE) {
                rawData.splice(i+1, 0, this._ESC_ESC_BYTE);
            }
        }
        //add SYN byte before begin sequence
        rawData.unshift(this._SYN_BYTE);

        return Buffer.from(rawData);
    }

    decode(codedData) {
        codedData = Array.prototype.slice.apply(codedData);
        codedData.shift(); //delete SYN byte

        //change escape sequence of bytes to 0xC0 and 0xDB bytes
        let retBuf = codedData.map(function (byte, i, arr) {
            if (byte === this._ESC_BYTE) {
                if (arr[i+1] === this._ESC_SYN_BYTE) {
                    return 0xC0;
                }
                else if (arr[i+1] === this._ESC_ESC_BYTE) {
                    return 0xDB;
                }
            }
            else if (byte === this._ESC_SYN_BYTE || byte === this._ESC_ESC_BYTE) {
                if (arr[i-1] === this._ESC_BYTE) {
                    return null;
                }
            }
            return byte;
        }.bind(this)).filter(function (byte) {
            return byte !== null;
        });

        return retBuf;
    }
}

module.exports = CodecOmnicomm;