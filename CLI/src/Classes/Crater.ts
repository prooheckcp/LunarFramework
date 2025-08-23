import RegistryContainer from "../Modules/RegistryContainer"

type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

export class Crater {
    name: string = "default-name";
    version: string = "0.0.1";
    registry: string = "default-registry";
    dependencies: Record<string, any> = {};
    pointers: {
        client: string;
        server: string;
        shared: string;
    } = {
        client: "default-client",
        server: "default-server",
        shared: "default-shared",
    };

    constructor(init: PartialDeep<Crater>) {
        function loopThruObject(object: any, assignableObject: any){
            for (const index of Object.getOwnPropertyNames(object)){
                if (typeof(object[index]) == "object"){
                    if (assignableObject[index])
                        loopThruObject(object[index], assignableObject[index])
                }else if (assignableObject[index])
                    object[index] = assignableObject[index]
            }
        }

        loopThruObject(this, init)
    }

    async Publish(){
        // Instead make RegistryContainer a class and the constructor ensures and gets. It will then have an interface for my git commands
        RegistryContainer.ensureAndGet(this.registry).then((dir: string) =>{
            /*Now need to check if it exists, then versioning and only then paste to it*/
            console.log(`Publishing ${this.name} to ${dir}`);
        })
    }
}
