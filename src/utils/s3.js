import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config();
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});
export const uploadToS3 = async (fileBuffer, fileName, contentType) => {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "try-on-us-assets";
    const key = `results/${Date.now()}_${fileName}`;
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
    });
    await s3Client.send(command);
    // Return the public URL (assuming the bucket has public read or uses cloudfront)
    return `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
};
export const getUploadUrl = async (fileName) => {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "try-on-us-assets";
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `uploads/${Date.now()}_${fileName}`,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
//# sourceMappingURL=s3.js.map