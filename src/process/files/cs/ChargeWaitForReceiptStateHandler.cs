using Abp.Configuration;
using Abp.Dependency;
using Castle.Core.Logging;
using LinkedX.Insurance.His;
using System;

namespace LinkedX.Insurance.Process.<%= classify(name) %>
{
    [State(ProcessType.Charge, ProcessState.WaitForReceipt, Metadata.Channel.<%= classify(name) %>)]
    public class ChargeWaitForReceiptStateHandler : IInternalStateHandler, ITransientDependency
    {
        public ILogger Logger { get; set; }

        ISettingManager _settingManager;
        ReceiptProvider _receiptProvider;
        public ChargeWaitForReceiptStateHandler(
            ISettingManager settingManager,
            ReceiptProvider receiptProvider)
        {
            _settingManager = settingManager;
            _receiptProvider = receiptProvider;
        }

        public bool OmitException => true;

        public void Handle(ProcessInternalStateChangedEvent eventData)
        {
            HisOrderData hisOrderData = null;
            try
            {
                hisOrderData = eventData.Process.GetDataStoreItem<HisOrderData>("HisData");
                var resultData = eventData.Process.GetDataStoreItem<SettleResultData>("SettleResult");
                var receipt = _receiptProvider.GenerateReceipt(hisOrderData, new ReceiptDto
                {
                    //TODO:设置报销费用
                    //Reimbursement = resultData.CalculateResultInfo.P10
                });

                //收费打印单
                string hospitalCode = _settingManager.GetSettingValue("<%= classify(name) %>.HospitalCode.Tenant");
                var patient = eventData.Process.GetDataStoreItem<PatientData>("Patient");
                receipt.Print = _receiptProvider.GeneratePrint(hospitalCode, patient, hisOrderData, resultData);

                eventData.Process.Receipt = receipt;
                eventData.Process.Action(new GenerateReceiptAction());
            }
            catch (Exception ex)
            {
                Logger.Error($"处理收据时报错：processId:{eventData.Process.Id}, error:{ex}");
                eventData.Process.Action(new SettleFailAction
                {
                    Error = "医保已结算，但生成收据失败。请手动检查此单"
                });
            }
        }
    }
}
