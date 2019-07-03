using LinkedX.Insurance.His;
using System.Collections.Generic;

namespace LinkedX.Insurance.Process.<%= classify(name) %>
{
    public class ReceiptProvider : ReceiptProviderBase
    {
        public ReceiptPrint GeneratePrint(string hospitalCode, PatientData patient, HisOrderData orderData, SettleResultData resultData)
        {
            decimal yibaoTotal = 0;
            foreach (var form in orderData.ChargeItemForms)
            {
                foreach (var item in form.ChargeItems)
                {
                    // 参与结算的
                    if (!string.IsNullOrEmpty(item.ChargeItem.ChannelData?.Id))
                    {
                        yibaoTotal += item.Total;
                    }
                }
            }

            ReceiptPrint print = new ReceiptPrint();
            print.HospitalCode = hospitalCode;
            print.YibaoTotal = yibaoTotal;
            //TODO:设置医保打印数据
            //print.PatientName = patient.P3;

            return print;
        }
    }
}
