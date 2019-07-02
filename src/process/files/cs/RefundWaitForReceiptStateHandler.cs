using Abp.Configuration;
using Abp.Dependency;
using Castle.Core.Logging;
using System;

namespace LinkedX.Insurance.Process.<%= classify(name) %>
{
    [State(ProcessType.Refund, ProcessState.WaitForReceipt, Metadata.Channel.<%= classify(name) %>)]
    public class RefundWaitForReceiptStateHandler : IInternalStateHandler, ITransientDependency
    {
        public ILogger Logger { get; set; }

        ISettingManager _settingManager;
        IProcessManager _processManager;
        ReceiptProvider _receiptProvider;
        public RefundWaitForReceiptStateHandler(
            ISettingManager settingManager,
            IProcessManager processManager,
            ReceiptProvider receiptProvider)
        {
            _processManager = processManager;
            _settingManager = settingManager;
            _receiptProvider = receiptProvider;
        }

        public bool OmitException => true;

        public void Handle(ProcessInternalStateChangedEvent eventData)
        {
            try
            {
                // his data;
                var chargeReceipt = _processManager.GetProcess(eventData.Process.ChargeProcessId.Value).Receipt;
                var refundReceipt = _receiptProvider.GenerateRefundReceipt(chargeReceipt);

                eventData.Process.Receipt = refundReceipt;
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
