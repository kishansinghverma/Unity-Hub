import { Button } from 'semantic-ui-react';
import data from './parties.json';
import { createNewParty } from '../operations/fetch';

export const Migrator: React.FC = () => {
    const execute = () => {
        data.Records.forEach(record => {
            const data = {
                name: record.Party,
                mandi: record.Mandi,
                state: record.State,
                stateCode: parseInt(record.StateCode),
                distance: parseInt(record.Distance),
                licenceNumber: record.PartyLicence ? record.PartyLicence.toUpperCase() : ''
            }

            createNewParty(data).then(()=>console.log('Created => ', data.name));
        })
    }

    return (
        <Button onClick={execute}>Go</Button>
    )
}