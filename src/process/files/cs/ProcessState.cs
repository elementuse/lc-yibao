namespace LinkedX.Insurance.Process.<%= classify(name) %>
{
    public class ProcessState
    {
        // 起始状态， 流程必须要有
        public const string Initial = nameof(Initial);

        public const string PreSettled = nameof(PreSettled);
        public const string WaitForReceipt = nameof(WaitForReceipt);

        // 中间冻结状态，需要有
        public const string Processing = nameof(Processing);

        // 终止状态， 流程必须要有
        public const string Settled = nameof(Settled);

        // 异常状态， 建议提供
        public const string SettleFailed = nameof(SettleFailed);
    }
}
