const CryptoJS = require("crypto-js");

// TripleDES encryption
function encryptData(data) {
    try {
        const ciphertext = CryptoJS.TripleDES.encrypt(JSON.stringify(data), process.env.CRYPTO_SECRET_KEY)?.toString();
        return ciphertext;
    } catch (error) {
        console.error("Encryption error:", error);
        throw error;
    }
}

function decryptData(ciphertext) {
    try {
        if (!ciphertext) throw new Error("Ciphertext is empty or undefined.");

        const fixedCiphertext = ciphertext.replace(/ /g, "+");
        const bytes = CryptoJS.TripleDES.decrypt(fixedCiphertext, process.env.CRYPTO_SECRET_KEY);

        if (!bytes?.sigBytes) return null;
        const originalData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return originalData;

    } catch (error) {
        return null;
    }
}


//AES encryption
function aesEncrypt(data) {
    try {
        const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), process.env.CRYPTO_SECRET_KEY)?.toString();
        return ciphertext;
    } catch (error) {
        console.error("Encryption error:", error);
        throw error;
    }
}

function aesDecrypt(ciphertext) {
    try {
        if (!ciphertext) throw new Error("Ciphertext is empty or undefined.");

        const fixedCiphertext = ciphertext.replace(/ /g, "+");
        const bytes = CryptoJS.AES.decrypt(fixedCiphertext, process.env.CRYPTO_SECRET_KEY);

        if (!bytes?.sigBytes) return null;
        const originalData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return originalData;

    } catch (error) {
        return null;
    }
}

module.exports = {
    encryptData,
    decryptData,
    aesEncrypt,
    aesDecrypt
};
