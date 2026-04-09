import { useState } from "react";
import "./App.css";
import DualList, { type Item } from "./dualist";

function App() {
    const rvLineList: Item[] = [
        { groupId: "과일", floorId: "포도" },
        { groupId: "과일", floorId: "사과" },
        { groupId: "과일", floorId: "파인애플" },
        { groupId: "과일", floorId: "바나나" },
        { groupId: "과일", floorId: "딸기" },
        { groupId: "채소", floorId: "토마토" },
        { groupId: "채소", floorId: "배추" },
        { groupId: "채소", floorId: "미나리" },
        { groupId: "채소", floorId: "양파" },
    ];

    const defaultValues: Item[] = [
        { groupId: "과일", floorId: "포도" },
        { groupId: "채소", floorId: "토마토" },
        { groupId: "과일", floorId: "바나나" },
    ];

    const [values, setValues] = useState(defaultValues);

    return (



        <div>
            <DualList
                rvLineList={rvLineList}
                DefaultValues={values}
                OnCheckedItemsChange={(allCheckedItems, changedItems) => {
                    console.log("all checked items", allCheckedItems);
                    console.log("changed items", changedItems);
                }}
            />
            <button onClick={(e) => {
                setValues([
                    { groupId: "과일", floorId: "포도" },
                    { groupId: "채소", floorId: "토마토" }])
            }}>선택한 아이템 변경</button>
        </div>
    );
}

export default App;
