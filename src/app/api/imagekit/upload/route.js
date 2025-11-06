import { NextResponse } from "next/server";
import ImageKit from "imagekit";
import { auth, } from "@clerk/nextjs/server";


// Initialize the image kit
const iamgeKit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
})

export async function POST(request) {

   try {
     
     // Verify authentication
     const { userId} = await auth();
     if(!userId) {
         return NextResponse.json({error : "Unauthorized"} , {status : 401})
     }
 
     // get form Data 
     const formData = await request.formData();
     const file = formData.get("file")
     const fileName = formData.get("fileName");
 
     if(!file) {
         return NextResponse.json({error : "No file Provided"} ,  {status : 400})
     }
 
 
     /// Convert file into buffer
     const bytes = await file.arrayBuffer();
     const buffer = Buffer.from(bytes);
 
     // Generate uniquer fileName
     const timestamp = Date.now()
     const sanitizedFileName = fileName?.replace(/[^a-zA-Z0-9.-]/g, "_") || "upload";
     const uniqueFileName = `${userId}/${timestamp}_${sanitizedFileName}`;
 
     // Upload  to imagKit - Simple Server side upload
     const uploadResponse = await iamgeKit.upload({
         file : buffer,
         fileName : uniqueFileName,
         folder : "/projects",
     });
 
 
     // Generates thumbnail URL using imageKit transoframations
     const thumbnailUrl = iamgeKit.url({
         src : uploadResponse.url,
         transformation : [
         {  
             height: 300,
             cropMode: "maintain_ar",
             quality: 80,
         }
         ]
     });
 
     // Return Upload Data
     return NextResponse.json({
       success: true,
       url: uploadResponse.url,
       thumbnailUrl: thumbnailUrl,
       fileId: uploadResponse.fileId,
       width: uploadResponse.width,
       height: uploadResponse.height,
       size: uploadResponse.size,
       name: uploadResponse.name,
     });
   } catch (error) {
    console.error("ImageKit Upload Error", error)
    return NextResponse.json({
        success : false,
        error  : "Failed to upload image",
        details : error.message,
    }, {status : 500})
   }
} 