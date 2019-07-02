import { YibaoSchema } from "../utils/yibaoschema";

export interface Schema extends YibaoSchema {
    advice: boolean;
    wisdom: boolean;
    department: boolean;
    doctor: boolean;
    diagnose: boolean;
}