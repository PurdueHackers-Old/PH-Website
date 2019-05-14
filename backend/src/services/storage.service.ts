import CONFIG from '../config';
import * as GoogleCloudStorage from '@google-cloud/storage';
import { Service } from 'typedi';
import { MemberDto } from '../models/member';

const storage = new GoogleCloudStorage({
	projectId: CONFIG.GC_PROJECT_ID,
	credentials: {
		private_key: CONFIG.GC_PRIVATE_KEY,
		client_email: CONFIG.GC_CLIENT_EMAIL
	}
});

const bucket = storage.bucket(CONFIG.GC_BUCKET);

@Service('storageService')
export class StorageService {
	async uploadToStorage(file: Express.Multer.File, folder: string, user: MemberDto) {
		if (!file) return 'No image file';
		else if (folder === 'pictures' && !file.originalname.match(/\.(jpg|jpeg|png|gif)$/i))
			return `File: ${file.originalname} is an invalid image type`;
		else if (folder === 'resumes' && !file.originalname.match(/\.(pdf)$/i))
			return `File: ${file.originalname} is an invalid image type`;

		const fileName = `${folder}/${user.email.replace('@', '_')}`;
		const fileUpload = bucket.file(fileName);

		return new Promise<string>((resolve, reject) => {
			const blobStream = fileUpload.createWriteStream({
				metadata: {
					contentType: file.mimetype,
					cacheControl: 'no-cache, max-age=0'
				}
			});

			blobStream.on('error', error => {
				console.error('Error uploading file to folder:', folder);
				// reject(new Error('Something is wrong! Unable to upload at the moment.'));
				reject(error);
			});

			blobStream.on('finish', () => {
				// The public URL can be used to directly access the file via HTTP.
				resolve(`https://storage.googleapis.com/${CONFIG.GC_BUCKET}/${fileName}`);
			});

			blobStream.end(file.buffer);
		});
	}
}
