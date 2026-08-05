import { v2 as cloudinary } from "cloudinary";

export const cloudinaryServices = {
  uploadUserAvtar: (fileBuffer: Buffer) => {
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

  uploadGroupAvtar: (fileBuffer: Buffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "chatify/group",
          resource_type: "image",
          transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "auto" },
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

  sendDirectImageMessage: (fileBuffer: Buffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "chatify/messages/directs",
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

  sendGroupImageMessage: (fileBuffer: Buffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "chatify/messages/groups",
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
