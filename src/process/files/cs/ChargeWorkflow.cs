using Stateless;
using System;
using System.Collections.Generic;

namespace LinkedX.Insurance.Process.<%= classify(name) %>
{
    [Workflow(ProcessType.Charge, Metadata.Channel.<%= classify(name) %>)]
    public class ChargeWorkflow : WorkflowBase
    {
        public ChargeWorkflow() : base()
        { }

        public ChargeWorkflow(Func<string> getState, Action<string> setState) : base(getState, setState)
        { }

        public override IList<Participant> GetParticipants()
        {
            return new List<Participant>
            {
                Participant.Cashier
            };
        }

        protected override void SetupStateMachine(StateMachine<string, string> stateMachine)
        {
            stateMachine.Configure(ProcessState.Initial)
                .SubstateOf(ProcessState.Processing)
                .Permit(nameof(PreSettleAction), ProcessState.PreSettled);

            stateMachine.Configure(ProcessState.PreSettled)
                .SubstateOf(ProcessState.Processing)
                .Permit(nameof(SettleAction), ProcessState.WaitForReceipt);

            stateMachine.Configure(ProcessState.WaitForReceipt)
                .SubstateOf(ProcessState.Processing)
                .Permit(nameof(GenerateReceiptAction), ProcessState.Settled);

            stateMachine.Configure(ProcessState.Processing)
                .Permit(nameof(SettleFailAction), ProcessState.SettleFailed)
                .Permit(nameof(SettleManuallyAction), ProcessState.Settled)
                .Ignore(nameof(RetryableFailAction));

            stateMachine.Configure(ProcessState.SettleFailed)
                .Permit(nameof(SettleManuallyAction), ProcessState.Settled);
        }
    }
}
