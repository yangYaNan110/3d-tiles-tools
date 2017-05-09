'use strict';
var validateI3dm = require('../../lib/validateI3dm');

describe('validate i3dm', function() {
    it('returns false if the i3dm has invalid magic', function() {
        expect(validateI3dm(createInvalidMagic()).result).toBe(false);
    });

    it('returns false if the i3dm has invalid version', function() {
        expect(validateI3dm(createInvalidVersion()).result).toBe(false);
    });

    it('returns false if the i3dm has wrong byteLength', function() {
        expect(validateI3dm(createWrongByteLength()).result).toBe(false);
    });

    it('returns false if the i3dm has invalid gITF Format', function() {
        expect(validateI3dm(createInvalidGltfFormat()).result).toBe(false);
    });

    it('validates an i3dm tile with a url glTF', function() {
        expect(validateI3dm(createI3dmTileGltfUrl()).result).toBe(true);
    });

    it('validates an i3dm tile with an embedded binary glTF', function() {
        expect(validateI3dm(createI3dmTileGltfBinaryGITF()).result).toBe(true);
    });
});

describe('validate i3dm batch table', function() {
    it('validates i3dm tile contains a valid batch table JSON', function() {
        expect(validateI3dm(createI3dmWithBatchJSON()).result).toBe(true);
    });

    it('returns false if i3dm tile contains an invalid batch table JSON', function() {
        expect(validateI3dm(createI3dmWithInvalidBatchJSON()).result).toBe(false);
    });

    it('returns false if i3dm tile contains a batch table JSON that is too long', function() {
        expect(validateI3dm(createI3dmWithBatchJSONLong()).result).toBe(false);
    });

    it('validates i3dm tile contains a valid batch table JSON and binary body', function() {
        expect(validateI3dm(createI3dmWithBatchJSONBinary()).result).toBe(true);
    });

    it('returns false if i3dm tile contains an invalid batch table JSON and binary body', function() {
        expect(validateI3dm(createI3dmWithInvalidBatchJSONBinary()).result).toBe(false);
    });
});

var i3dmHeaderSize = 32;
var magicOffset = 0;
var versionOffset = 4;
var byteLengthOffset = 8;
var featureTableJSONByteLengthOffset = 12;
var featureTableBinaryByteLengthOffset = 16;
var batchTableJSONByteLengthOffset = 20;
var batchTableBinaryByteLengthOffset = 24;
var gltmFormatOffset = 28;

function createI3dmTileGltfUrl() {
    var header = new Buffer(i3dmHeaderSize);
    header.write('i3dm', magicOffset); // magic
    header.writeUInt32LE(1, versionOffset); // version
    header.writeUInt32LE(header.length, byteLengthOffset); // byteLength
    header.writeUInt32LE(0, featureTableJSONByteLengthOffset); // featureTableJSONByteLength
    header.writeUInt32LE(0, featureTableBinaryByteLengthOffset); // featureTableBinaryByteLength
    header.writeUInt32LE(0, batchTableJSONByteLengthOffset); // batchTableJSONByteLength
    header.writeUInt32LE(0, batchTableBinaryByteLengthOffset); // batchTableBinaryByteLength
    header.writeUInt32LE(0, gltmFormatOffset); // gltfFormat: 0 - url

    return header;
}

function createI3dmTileGltfBinaryGITF() {
    var header = createI3dmTileGltfUrl();
    header.writeUInt32LE(1, gltmFormatOffset); // gltfFormat: 1 - embedded binary gITF

    return header;
}

function createInvalidMagic() {
    var header = createI3dmTileGltfUrl();
    header.write('xxxx', magicOffset);

    return header;
}

function createInvalidVersion() {
    var header = createI3dmTileGltfUrl();
    header.writeUInt32LE(5, versionOffset);

    return header;
}

function createWrongByteLength() {
    var header = createI3dmTileGltfUrl();
    header.writeUInt32LE(header.length - 1, byteLengthOffset);

    return header;
}

function createInvalidGltfFormat() {
    var header = createI3dmTileGltfUrl();
    header.writeUInt32LE(5, gltmFormatOffset);

    return header;
}

function createI3dmWithBatchJSON() {
    var header = createI3dmTileGltfUrl();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    var batchTableJSON = createValidBatchTableJSON();
    header.writeUInt32LE(header.length + featureTableJSON.length + batchTableJSON.length, byteLengthOffset);
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTableJSON.length, batchTableJSONByteLengthOffset);

    return Buffer.concat([header, featureTableJSON, batchTableJSON]);
}

function createI3dmWithInvalidBatchJSON() {
    var header = createI3dmTileGltfUrl();
    var featureTableJSON = createBatchLengthFeatureTable(1);
    var batchTableJSON = createInvalidBatchTableJSON();
    header.writeUInt32LE(header.length + featureTableJSON.length + batchTableJSON.length, byteLengthOffset);
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTableJSON.length, batchTableJSONByteLengthOffset);

    return Buffer.concat([header, featureTableJSON, batchTableJSON]);
}

function createI3dmWithBatchJSONLong() {
    var header = createI3dmTileGltfUrl();
    var batchTableJSON = createValidBatchTableJSON();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    header.writeUInt32LE(header.length + featureTableJSON.length + batchTableJSON.length - 1, byteLengthOffset);
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTableJSON.length, batchTableJSONByteLengthOffset);

    return Buffer.concat([header, featureTableJSON, batchTableJSON]);
}

function createI3dmWithBatchJSONBinary() {
    var header = createI3dmTileGltfUrl();
    var batchTable = createValidBatchTableBinary();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    header.writeUInt32LE(header.length + featureTableJSON.length + batchTable.buffer.length, byteLengthOffset);
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, batchTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, batchTableBinaryByteLengthOffset);

    return Buffer.concat([header, featureTableJSON, batchTable.buffer]);
}

function createI3dmWithInvalidBatchJSONBinary() {
    var header = createI3dmTileGltfUrl();
    var batchTable = createInvalidBatchTableBinary();
    var featureTableJSON = createBatchLengthFeatureTable(3);
    header.writeUInt32LE(header.length + featureTableJSON.length + batchTable.buffer.length, byteLengthOffset);
    header.writeUInt32LE(featureTableJSON.length, featureTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTable.batchTableJSONByteLength, batchTableJSONByteLengthOffset);
    header.writeUInt32LE(batchTable.batchTableBinaryByteLength, batchTableBinaryByteLengthOffset);

    return Buffer.concat([header, featureTableJSON, batchTable.buffer]);
}

function createBatchLengthFeatureTable(batchLength) {
    var featureTableJSON = {
        BATCH_LENGTH : batchLength
    };

    return new Buffer(JSON.stringify(featureTableJSON));
}

function createValidBatchTableJSON() {
    var batchTableJSON = {
        id : [0,1,2],
        longitude : [-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height : [8,14,14]
    };

    return new Buffer(JSON.stringify(batchTableJSON));
}

function createInvalidBatchTableJSON() {
    var batchTableJSON = {
        id : [0],
        longitude : [-1.3196595204101946],
        height : 8
    };

    return new Buffer(JSON.stringify(batchTableJSON));
}

function createValidBatchTableBinary() {
    var batchTableJSON = {
        id : [0, 1, 2],
        longitude : [-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height : {
            "byteOffset" : 0,
            "componentType" : 'UNSIGNED_INT',
            "type" : 'SCALAR'
        }
    };

    var jsonHeader = new Buffer(JSON.stringify(batchTableJSON));

    var heightBinaryBody = new Buffer(12);
    heightBinaryBody.writeUInt32LE(8, 0);
    heightBinaryBody.writeUInt32LE(14, 4);
    heightBinaryBody.writeUInt32LE(14, 8);

    return {
        buffer: Buffer.concat([jsonHeader, heightBinaryBody]),
        batchTableJSONByteLength: jsonHeader.length,
        batchTableBinaryByteLength: heightBinaryBody.length
    };
}

function createInvalidBatchTableBinary() {
    var batchTableJSON = {
        id : [0, 1, 2],
        longitude : [-1.3196595204101946,-1.3196567190670823,-1.3196687138763508],
        height : {
            "byteOffset" : 0,
            "componentType" : 'UNSIGNED_INT'
        }
    };

    var jsonHeader = new Buffer(JSON.stringify(batchTableJSON));

    var heightBinaryBody = new Buffer(12);
    heightBinaryBody.writeUInt32LE(8, 0);
    heightBinaryBody.writeUInt32LE(14, 4);
    heightBinaryBody.writeUInt32LE(14, 8);

    return {
        buffer: Buffer.concat([jsonHeader, heightBinaryBody]),
        batchTableJSONByteLength: jsonHeader.length,
        batchTableBinaryByteLength: heightBinaryBody.length
    };
}
