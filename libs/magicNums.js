/**
 * Created by spolu on 02.06.2016.
 */
const MAGIC_NUMS = {
    CMD_OFFSET: 0x00,
    LEN_OFFSET: 0x01,
    DATA_OFFSET: 0x02,
    //const for element data packet
    ELEM_TYPE_OFFSET: 0x00,
    ELEM_ID_OFFSET: 0x01,
    ELEM_ID_LEN: 4,
    ELEM_PAYLOAD_OFFSET: 0x05,
    ELEM_LEN: new Map([
        [0x11, 34],      //["element type", "element length"]
        [0x12, 34],
        [0x13, 34],
        [0x14, 34],
        [0x15, 34],
        [0x16, 40],
        [0x17, 34],
        [0x18, 34],
        [0x19, 34],
        [0x20, 25],
        [0x21, 40],
        [0x22, 4]
    ]),
    //const for some command
    INIT_CMD: {
        CODE: 0x00,
        ID_OFFSET: 0x02,
        ID_LEN: 4,
        FW_OFFSET: (0x02 + 4),
        FW_LEN: 4
    },
    RES_CMD: {
        CODE: 0x01,
        LEN: 8,
        ALL_DATA_ID: 0xFFFFFFFF
    },
    CONFIRM_CMD: {
        CODE: 0x11,
        LEN: 4
    },
    DATA_SEQ_CMD: {
        CODE_FOR_SERVER: 0x02,
        CODE_FOR_TERM: 0x0F
    },
    DELETE_ELEM_CMD: {
        CODE: 0x03,
        LEN: 8
    },
    CONFIRM_DEL_ELEM_CMD: {
        CODE: 0x04
    }
};

module.exports = MAGIC_NUMS;