const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const ErrorHandler = require('../utils/errorHandling');

async function s3upload(path, files) {
    if (!Array.isArray(files) || files.length === 0) throw new ErrorHandler("Files are required for upload", 404);

    const {
        AWS_S3_BUCKET_NAME,
        AWS_S3_BUCKET_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
    } = process.env;

    if (!AWS_S3_BUCKET_NAME || !AWS_S3_BUCKET_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) throw new Error("AWS credentials or S3 configuration missing in environment variables");

    const s3Client = new S3Client({
        region: AWS_S3_BUCKET_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
    });

    const uploadResults = [];

    for (const file of files) {
        if (!file || !file.buffer) continue;

        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const mimetype = file.mimetype || 'application/octet-stream';
        const extension = mime.extension(mimetype) || 'bin';
        const key = path ? `${path}/${filename}.${extension}` : `${filename}.${extension}`;

        const uploadParams = {
            Bucket: AWS_S3_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: mimetype,
        };

        try {
            await s3Client.send(new PutObjectCommand(uploadParams));
            const url = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_S3_BUCKET_REGION}.amazonaws.com/${key}`;

            uploadResults.push({
                url,
                key,
            });
        } catch (error) {
            console.error('S3 Upload Error:', error);
            throw new ErrorHandler("S3 upload failed", 500);
        }
    }

    return uploadResults;
}

module.exports = s3upload;
