using Abp.Dependency;
using Castle.Core.Logging;

namespace LinkedX.Insurance.Process.<%= classify(name) %>
{
    [State(ProcessType.Refund, ProcessState.Initial, Metadata.Channel.<%= classify(name) %>)]
    public class RefundStartStateHandler : IInternalStateHandler, ITransientDependency
    {
        public ILogger Logger { get; set; }

        IProcessManager _processManager;
        public RefundStartStateHandler(IProcessManager processManager)
        {
            _processManager = processManager;
        }

        public bool OmitException => false;

        public void Handle(ProcessInternalStateChangedEvent eventData)
        {
            if (eventData.Process.Channel == Metadata.Channel.<%= classify(name) %> &&
                eventData.Process.Type == ProcessType.Refund)
            {
                var chargeProcess = _processManager.GetProcess(eventData.Process.ChargeProcessId.Value);
                
                var patient = chargeProcess.GetDataStoreItem(nameof(PreSettleAction.Patient));
                var hisData = chargeProcess.GetDataStoreItem(nameof(PreSettleAction.HisData));
                var settleResult = chargeProcess.GetDataStoreItem(nameof(SettleAction.SettleResult));
                eventData.Process.SetDataStoreItem("patient", patient);
                eventData.Process.SetDataStoreItem("hisData", hisData);
                eventData.Process.SetDataStoreItem("settleResult", settleResult);
            }
        }
    }
}
