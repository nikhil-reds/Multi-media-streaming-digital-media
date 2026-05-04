import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});

export async function uploadFile(filePath, bucketName, key, contentType = "application/pdf") {
    const fileContent = fs.readFileSync(filePath);
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
    });
    const response = await s3.send(command);
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
