What is Cloudflare worker
-ไว้ up application ไปที่  worker โดยที่ cloudflare จะทำการ host หรือ deploy ให้auto
//Document Cloudflare worker
//https://developers.cloudflare.com/workers/get-started/guide/

Start project with
npm create cloudflare@latest -- my-first-worker

All you start: Please Login cloudflare account
-npx wrangler login
-npx wrangler logout

Local deploy : bun run dev
Public deploy : bun wrangler deploy

Make api with HONO

What is R2 Bucket
-its the storage for unstructure data ex. png mp3
How to connect R2?
-set up in wrangler.jsonc

"r2_buckets": [
		{
			"binding": "r2",//name for calling
			"bucket_name": "test-bucket" //name of bucket at cloudflare
		}
	]

.r2.dev คือ Public URL สำหรับเข้าถึงไฟล์ใน Cloudflare R2 โดยตรง
//https://pub-xxxxxxxxxxxxxxxxxxx.r2.dev