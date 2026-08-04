import { v2 as cloudinary } from "cloudinary";

export const cloudinaryServices = {
  uploadAvtar: (fileBuffer: Buffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "chatify/avatars",
          resource_type: "image",
          transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "face" },
          ],
        },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        },
      );

      stream.end(fileBuffer);
    });
  },

  sendMessageImage: (fileBuffer: Buffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "chatify/messages",
          resource_type: "image",
        },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        },
      );

      stream.end(fileBuffer);
    });
  },
};
