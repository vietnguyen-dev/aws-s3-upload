import { Inter } from "next/font/google";
import { useState, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
	const [imageList, setImageList] = useState<string[]>([]);
	const [file, setFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState<string>("");

	useEffect(() => {
		async function getImages() {
			const response = await fetch("/api/image");
			const data = await response.json();
			setImageList(data.urls);
		}
		getImages();
	}, []);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files.length > 0) {
			setFile(event.target.files[0]);
			setFileName(event.target.files[0].name);
		}
	};

	async function getImages() {
		const response = await fetch("/api/image");
		const data = await response.json();
		setImageList(data.urls);
	}

	async function uploadImage(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!file) {
			return;
		}
		try {
			let formData = new FormData();
			formData.append("file", file, fileName);
			formData.append("fileName", fileName);
			// Make a POST request to the API endpoint
			const response = await fetch("/api/image-upload", {
				method: "POST",
				body: formData,
			});
			if (response.ok) {
				console.log("File uploaded successfully");
				// Handle success
				setTimeout(async () => await getImages(), 500);
			} else {
				const errorMessage = await response.text();
				console.error("Upload failed:", errorMessage);
				// Handle failure
			}
		} catch (error) {
			console.error("Error uploading file:", error);
			// Handle error
		}
	}

	async function deleteImage(url: string) {
		try {
			const response = await fetch("api/image", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ url: url }),
			});
			if (response.ok) {
				console.log("file deleted successfully");
				await getImages();
			} else {
				const errorMsg = await response.text();
				console.error("delete failed", errorMsg);
			}
		} catch (err) {
			console.log(err);
		}
	}

	return (
		<main className={`${inter.className} m-4 flex justify-center flex-col items-center`}>
			<h1 className="text-center text-3xl mb-3">Upload an image</h1>
			{imageList.length < 3 ? (
				<form className="my-3 flex flex-col items-center" onSubmit={uploadImage}>
					<input type="file" className="file-input w-full max-w-xs file-input-bordered" accept=".png,.jpg,.jpeg" onChange={handleFileChange} />
					<button type="submit" className="btn btn-primary w-32 mt-3">
						Submit
					</button>
				</form>
			) : (
				<p className="mb-3">thats enough images please dont overload my server :3</p>
			)}
			{imageList.length === 0 ? (
				<p>No image Uploaded</p>
			) : (
				<div className="flex flex-col">
					{imageList.map((url) => (
						<div key={url}>
							<img src={url} alt="uploaded image" />
							<button className="btn btn-secondary w-32 mt-3" onClick={() => deleteImage(url)}>
								Delete
							</button>
						</div>
					))}
				</div>
			)}
		</main>
	);
}
