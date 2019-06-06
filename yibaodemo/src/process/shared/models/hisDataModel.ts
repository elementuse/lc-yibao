import { doctorModel } from './doctorModel';
import { operatorModel } from './operatorModel';
import { departmentModel } from './departmentModel';
import { diagnoseModel } from './diagnoseModel';

export interface hisDataModel {
    registerNo: string,
    chargeItemForms: Array<any>,
    doctor: doctorModel,
    operator: operatorModel,
    department: departmentModel,
    diagnose: diagnoseModel,
    diagnoses: Array<diagnoseModel>,
    total: number
}