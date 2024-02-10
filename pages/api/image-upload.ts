// Next.js API route support: https://nextjs.ogg/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import AWS from "aws-sdk";
import { IncomingForm } from "formidable";
import fs from "fs";

type SuccessGetData = {
	urls: (string | null)[] | undefined;
};

type ErrorData = {
	message: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuccessGetData | ErrorData>) {
	AWS.config.update({
		accessKeyId: process.env.aws_access_key_id,
		secretAccessKey: process.env.secret_access_key,
		region: process.env.region,
	});

	const s3 = new AWS.S3();
	const bucket = process.env.bucket!;

	if (req.method === "POST") {
		return new Promise((resolve) => {
			try {
				const form = new IncomingForm();
				form.parse(req, (err, fields, files) => {
					if (err) {
						console.error("Error parsing form data:", err);
						return res.status(500).json({
							message: "Internal Server Error",
						});
						resolve();
					}
					console.log("Parsed form fields:", fields);
					const fileData = fs.readFileSync(files.file[0].filepath);
					console.log("Parsed files:", files);
					s3.putObject({
						Bucket: bucket,
						Body: fileData,
						Key: fields.fileName[0],
					}).promise();
					// Handle the parsed form data
					return res.status(200).json({ message: "it worked" });
					resolve();
				});
				// Access file details
				// Access the uploaded file and file name
				/*if (!req.file) {
				return res.status(400).json({
					message: "File content not found",
				});
			}

			// Ensure req.body.fileName contains the file name
			if (!req.body.fileName) {
				return res.status(400).json({
					message: "File name not found",
				});
			}*/
			} catch (err) {
				console.log(err);
				res.status(500).json({
					message: "Error uploading image to S3",
				});
				return resolve();
			}
		});
	} else {
		res.status(400).json({ message: "not a valid route" });
	}
}
// export this from the api route
export const config = {
	api: {
		bodyParser: false,
	},
};
