export default function loopThruObject(object: any, assignableObject: any){
    for (const index of Object.getOwnPropertyNames(object)){
        if (typeof(object[index]) == "object"){
            if (assignableObject[index])
                loopThruObject(object[index], assignableObject[index])
        }else if (assignableObject[index])
            object[index] = assignableObject[index]
    }
}