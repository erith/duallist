import "./App.css";
import DualList, { type CheckableItem, type Item } from "./dualist";

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

    const defaultValues: CheckableItem[] = [
        { groupId: "과일", floorId: "포도", checked: true },
        { groupId: "채소", floorId: "토마토", checked: true },
        { groupId: "과일", floorId: "바나나", checked: true },
    ];

    return (
        <DualList
            rvLineList={rvLineList}
            DefaultValues={defaultValues}
            OnCheckedItemsChange={(allCheckedItems, changedItems) => {
                console.log("all checked items", allCheckedItems);
                console.log("changed items", changedItems);
            }}
        />
    );
}

export default App;
