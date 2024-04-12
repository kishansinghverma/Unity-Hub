import { Button } from 'semantic-ui-react';
import data from './parties.json';
import { createNewParty } from '../operations/fetch';

export const Migrator: React.FC = () => {
    const execute = () => {
        data.forEach((record:any) => {
            const data = {
                name: record.name,
                mandi: record.mandi,
                state: record.state,
                stateCode: record.stateCode,
                distance: record.distance,
                licenceNumber: record.licenceNumber?.toUpperCase()
            }

            createNewParty(data).then(()=>console.log('Created => ', data.name));
        })
    }

    return (
        <Button onClick={execute}>Go</Button>
    )
}