// Next.js API route support: https://nextjs.ogg/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import AWS from "aws-sdk";

type SuccessData = {
	urls: (string | null)[] | undefined;
};

type ErrorData = {
	message: string;
};

function getImageKey(url: string) {
	const lastSlashIdx = url.lastIndexOf("/");
	const lastQuestionIdx = url.lastIndexOf("?");
	const fileNameSubstring = url.substring(lastSlashIdx + 1, lastQuestionIdx !== -1 ? lastQuestionIdx : undefined);
	return fileNameSubstring;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuccessData | ErrorData>) {
	AWS.config.update({
		accessKeyId: process.env.aws_access_key_id,
		secretAccessKey: process.env.secret_access_key,
		region: process.env.region,
	});

	const s3 = new AWS.S3();
	const bucket = process.env.bucket!;
	if (req.method === "GET") {
		try {
			const data = await s3.listObjectsV2({ Bucket: bucket }).promise();
			if (data.Contents) {
				const signedURLs = await Promise.all(
					data.Contents.map(async (object) => {
						const params = {
							Bucket: bucket,
							Key: object.Key!,
							Expires: 3600,
						};

						try {
							const signedURL = await s3.getSignedUrlPromise("getObject", params);
							return signedURL;
						} catch (error) {
							console.error("Error generating signed URL:", error);
							return null; // or handle the error in another way
						}
					})
				);

				return res.status(200).json({
					urls: signedURLs.filter((url) => url !== null), // filter out any null values
				});
			} else {
				return res.status(400).json({
					message: "trouble fetching images",
				});
			}
		} catch (err) {
			console.log(err);
		}
	}
	if (req.method === "DELETE") {
		console.log(req.body);
		const key = getImageKey(req.body.url);
		try {
			// Delete object from S3
			await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
			//
			console.log(`Object with key ${key} deleted successfully.`);
			return res.status(200).json({ message: "image deleted" });
		} catch (err) {
			console.error(err);
			return res.status(400).json({ message: "trouble deleting image" });
		}
	} else {
		res.status(400).json({ message: "not a valid route" });
	}
}
// export this from the api route
export const config = {
	api: {
		bodyParser: true,
	},
};
