import { Hono , Context} from "hono";
import { S3Client, PutObjectCommand, GetObjectCommand} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
//type
type typeIMG = {
    r2 : R2Bucket ,
    S3endpoint: string,
    s3accesid:string,
    s3acceskey:string,
}
const imgType = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
]

const app = new Hono<{Bindings: typeIMG}>()

//fn
const protectUpload = async(c : Context, next : Function) =>{
    // console.log("req",c.req)
    const body = await c.req.parseBody()
    console.log("body here",body)
    const secret = body["secret"]
    if (secret !== c.env.SECRET_IMG) {
        return c.text("Wrong secret")
    }else{
        await next()
    }
}

//เอาไว้สร้าง S3Client ที่ “รู้จัก bucket”เพื่อให้คุณสามารถ upload / download / list / delete ไฟล์ ผ่าน S3-compatible API
function configS3Client(c:Context){ 
    return new S3Client({
        region:"auto",
        endpoint : c.env.S3endpoint,
        credentials:{
            accessKeyId: c.env.s3accesid,
            secretAccessKey : c.env.s3acceskey
        }
    })
}
const getpreSignedUrl= async(c:Context,bucket_name: string,img_name:string)=>{
    const S3 = configS3Client(c)

    return await getSignedUrl(
        S3,
        new GetObjectCommand({
            Bucket:bucket_name,
            Key:img_name
        }),{
            expiresIn:15
        }
    )
}
app.get("/expire-test/:imgname", async(c)=>{
    const url = await getpreSignedUrl(c, "test-bucket", c.req.param("imgname"))
    return c.text(url)
})
//route
app.get('/get-img/:imgname',async (c)=>{
    const { imgname } = c.req.param()
    console.log("param here",imgname)
    const img = await c.env.r2.get(imgname)
    if (!img) {
        return c.json({image:"Not found image"})
    }
    return c.body(img?.body)
})

app.post('/upload',protectUpload, async (c) =>{
    try{
        const body = await c.req.parseBody()
        const file = body["image"] as File
        if (!file){
            return c.json({message:"Error from upload-api, file is empty"})
        }else{
            console.log("File type here",file.type)
            if(!imgType.includes(file.type)){
                return c.json({message:"Wrong type of file"})
            }
            const fileName = file.name //ดึงชื่อไฟล์
            const duplicate = await c.env.r2.get(fileName)
            if (duplicate){
                return c.json({message:"File name is already exist"})
            } 
            const res = await c.env.r2.put(fileName, file)
            return c.json({message:"File succesfully upload",Response:res})

        }
    }catch(erorr){
        return c.json({message:"Error from upload-api"})
    }
})

app.post('/upload-protected',protectUpload, async (c) => {
    console.log("upload-protected , working")
    try {
        const body = await c.req.parseBody();
        const file = body["image"] as File;

        if (!file) {
            return c.json(
                { success: false, message: "No file provided" },
                400
            );
        }

        const key = `${Date.now()}-${file.name}`;

        await c.env.r2.put(key, file);

        return c.json({
            success: true,
            file: { key, name: file.name, size: file.size },
        });

    } catch (error: any) {
        return c.json(
            { success: false, message: "Upload failed", error: error.message },
            500
        );
    }
});

export default app