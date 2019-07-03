using Abp.Configuration;
using System.Collections.Generic;

namespace LinkedX.Insurance.Settings.Channels
{
    public class <%= classify(name) %>SettingProvider : SettingProvider
    {
        public override IEnumerable<SettingDefinition> GetSettingDefinitions(SettingDefinitionProviderContext context)
        {
            var group = new SettingDefinitionGroup(Metadata.Channel.<%= classify(name) %>, "<%= display %>医保".L());
            return new[]
            {
                new SettingDefinition(
                    "<%= classify(name) %>.HospitalCode.Application",
                    string.Empty,
                    "医疗机构编码".L(),
                    group,
                    scopes: SettingScopes.Application,
                    isVisibleToClients: true
                ),
                new SettingDefinition(
                    "<%= classify(name) %>.HospitalCode.Tenant",
                    string.Empty,
                    "医疗机构编码".L(),
                    group,
                    scopes: SettingScopes.Tenant,
                    isVisibleToClients: true
                )
            };
        }
    }
}
