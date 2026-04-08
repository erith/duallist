import { useState } from "react";
import _ from 'underscore';
export type Item = {
    groupId: string;
    floorId: string;
}

type Props = {
    DefaultValues: Item[],
    CheckedItems: string[]
}

type Checkable = {
    checked: boolean;
}

export const DualList = (props: Props) => {

    const [items, setItems] = useState(props.DefaultValues);
    const keyGroups = _.countBy(items, 'groupId');
    const [groupKey, setGroupKey] = useState(items?.length > 0 ? items[0].groupId : null);

    return <div style={{ display: 'flex' }}>
        <div>
            <ul>
                {_.map(keyGroups, (count, key) => <li key={key}
                    style={{
                        cursor: "pointer",
                        backgroundColor: groupKey == key ? 'orange' : 'transparent'
                    }}
                    onClick={(e) => {
                        setGroupKey(key);
                    }}
                >{key} ({count})</li>)}

            </ul>
        </div>
        <div><ul>
            {
                _.where(items, { groupId: groupKey ?? '' }).map(v =>
                    <li key={v.floorId}>{v.floorId}</li>
                )
            }
        </ul></div>
    </div>
}

export default DualList;