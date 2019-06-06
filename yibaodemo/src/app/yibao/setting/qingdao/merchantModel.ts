export class merchantModel {
    category: string;
    name: string;
    subname: string;
    uscc: string;
    sinid: string;

    static fromJSON(json: string): merchantModel {
        let obj = JSON.parse(json);
        let result = new merchantModel();
        result.category = obj["category"];
        result.name = obj["name"];
        result.subname = obj["subname"];
        result.uscc = obj["uscc"];
        result.sinid = obj["sinid"];
        return result;
    }
}
