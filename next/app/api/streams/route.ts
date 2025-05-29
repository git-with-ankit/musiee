import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";
//@ts-ignore
import youtubesearchapi from "youtube-search-api"

const YT_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:watch\?(?!.*\blist=)(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&]\S+)?$/;


const StreamSchema = z.object({
    creatorId : z.string(),
    url : z.string()
})

export default async function POST(req: NextRequest){
    try{
        const data = StreamSchema.parse(await req.json());
        const isYoutube = data.url.match(YT_REGEX); 

        if(!isYoutube){
            return NextResponse.json({
                message : "Wrong URL Format"
            },{
                status : 411
            })
        }
        const extractedId = data.url.split("?v=")[1];
        const res = youtubesearchapi.GetVideoDetails(extractedId);
        const thumbnails = res.thumbnail.thumbnails;
        thumbnails.sort((a:{width: number}, b: {width: number})=> a.width< b.width ? -1 : 1);
        const stream = await prismaClient.stream.create({
            data : {
                userId: data.creatorId,
                url: data.url,
                type: "Youtube",
                extractedId : extractedId,
                title : res.title ?? "Stream",
                bigImg: thumbnails[thumbnails.length-1].url ?? "https://cdn.pixabay.com/photo/2013/07/13/12/41/music-160112_640.png",
                smallImg: thumbnails[0].url ?? "https://cdn.pixabay.com/photo/2013/07/13/12/41/music-160112_640.png"
            }
            
        })
        return NextResponse.json({
            message : "Your stream is added.",
            id : stream.id
        })
    }catch(e){
        return NextResponse.json({

            messsage : "Error while adding a stream"
        })

    }
}