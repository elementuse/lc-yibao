using Stateless;
using System;
using System.Collections.Generic;

namespace LinkedX.Insurance.Process.<%= classify(name) %>
{
    [Workflow(ProcessType.Refund, Metadata.Channel.<%= classify(name) %>)]
    public class RefundWorkflow : WorkflowBase
    {
        public RefundWorkflow() : base()
        { }

        public RefundWorkflow(Func<string> getState, Action<string> setState) : base(getState, setState)
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
                .Permit(nameof(RefundAction), ProcessState.WaitForReceipt);

            stateMachine.Configure(ProcessState.WaitForReceipt)
                .SubstateOf(ProcessState.Processing)
                .Permit(nameof(GenerateReceiptAction), ProcessState.Settled);

            stateMachine.Configure(ProcessState.Processing)
                .Permit(nameof(RefundFailAction), ProcessState.SettleFailed);

            stateMachine.Configure(ProcessState.SettleFailed)
                .Permit(nameof(RefundManuallyAction), ProcessState.Settled);
        }
    }
}
