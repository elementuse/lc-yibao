using Newtonsoft.Json.Linq;

namespace LinkedX.Insurance.Process.<%= classify(name) %>
{
    public class PreSettleAction : ActionBase
    {
        [DataStore]
        public PatientData Patient { get; set; }

        [DataStore]
        public His.HisOrderData HisData { get; set; }

        [DataStore(allowOverride: true)]
        public SettleResultData SettleResult { get; set; }
    }

    public class SettleAction : ActionBase
    {
        [DataStore(allowOverride: true)]
        public SettleResultData SettleResult { get; set; }
    }

    public class GenerateReceiptAction : ActionBase
    {
    }

    public class RetryableFailAction : ActionBase
    {
    }

    public class SettleFailAction : ActionBase
    {
        [DataStore]
        public string Error { set; get; }
    }

    public class SettleManuallyAction : SettleAction
    {
    }

    public class RefundAction : ActionBase
    {
        [DataStore]
        public JObject RefundResult { get; set; }
    }

    public class RefundFailAction : ActionBase
    {
    }

    public class RefundManuallyAction : RefundAction
    {
    }
}
