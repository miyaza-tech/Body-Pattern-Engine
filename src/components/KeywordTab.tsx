import { useState } from "react";
import type { KeywordDef, KeywordType } from "../types";

interface KeywordTabProps {
  keywords: KeywordDef[];
  grouped: Record<KeywordType, KeywordDef[]>;
  onAddKeyword: (name: string, type: KeywordType) => boolean;
  onUpdateKeyword: (id: string, name: string) => boolean;
  onDeleteKeyword: (id: string) => void;
  onResetDefaults: () => void;
  showToast: (message: string) => void;
}

const TYPE_LABELS: Record<KeywordType, string> = {
  scale: "강도형 (0-3)",
  check: "체크형",
  event: "이벤트",
  tag: "태그",
};

export function KeywordTab({
  grouped,
  onAddKeyword,
  onUpdateKeyword,
  onDeleteKeyword,
  onResetDefaults,
  showToast,
}: KeywordTabProps) {
  const [newKeywordName, setNewKeywordName] = useState("");
  const [newKeywordType, setNewKeywordType] = useState<KeywordType>("scale");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAddKeyword = () => {
    if (onAddKeyword(newKeywordName, newKeywordType)) {
      setNewKeywordName("");
      setNewKeywordType("scale");
      showToast("키워드가 추가되었습니다.");
    }
  };

  const handleSaveEdit = () => {
    if (editingId && onUpdateKeyword(editingId, editingName)) {
      setEditingId(null);
      setEditingName("");
      showToast("키워드가 수정되었습니다.");
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`"${name}" 키워드를 삭제하시겠습니까?`)) {
      onDeleteKeyword(id);
      showToast("키워드가 삭제되었습니다.");
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("기본 키워드 세트로 복원하시겠습니까? 현재 키워드가 모두 삭제됩니다.")) {
      onResetDefaults();
      showToast("기본 키워드로 복원되었습니다.");
    }
  };

  return (
    <section className="card" aria-labelledby="keyword-tab-title">
      <h2 id="keyword-tab-title">키워드등록</h2>

      <div className="record-section">
        <h3>키워드 추가</h3>
        <form
          className="keyword-add-row"
          onSubmit={(e) => {
            e.preventDefault();
            handleAddKeyword();
          }}
        >
          <input
            value={newKeywordName}
            onChange={(e) => setNewKeywordName(e.target.value)}
            placeholder="키워드 이름"
            aria-label="새 키워드 이름"
            maxLength={50}
          />
          <select
            value={newKeywordType}
            onChange={(e) => setNewKeywordType(e.target.value as KeywordType)}
            aria-label="키워드 유형 선택"
          >
            <option value="scale">0-3 강도형</option>
            <option value="check">체크형</option>
            <option value="event">이벤트</option>
            <option value="tag">태그</option>
          </select>
          <button type="submit">추가</button>
        </form>
        <div className="row-actions">
          <button onClick={handleResetDefaults}>기본 세트 복원</button>
        </div>
      </div>

      {(["scale", "check", "event", "tag"] as KeywordType[]).map((type) => (
        <details key={type} className="record-section collapse" open={type === "scale"}>
          <summary>{TYPE_LABELS[type]}</summary>
          <ul className="keyword-list" role="list">
            {grouped[type].map((keyword) => (
              <li key={keyword.id} className="keyword-item-row">
                {editingId === keyword.id ? (
                  <form
                    className="keyword-edit-row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveEdit();
                    }}
                  >
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      aria-label="키워드 이름 수정"
                      autoFocus
                    />
                    <button type="submit">저장</button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      취소
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="keyword-name">{keyword.name}</span>
                    <div className="chip-list">
                      <button
                        className="chip"
                        onClick={() => {
                          setEditingId(keyword.id);
                          setEditingName(keyword.name);
                        }}
                        aria-label={`${keyword.name} 편집`}
                      >
                        편집
                      </button>
                      <button
                        className="chip"
                        onClick={() => handleDelete(keyword.id, keyword.name)}
                        aria-label={`${keyword.name} 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
            {grouped[type].length === 0 && <p className="empty">항목 없음</p>}
          </ul>
        </details>
      ))}
    </section>
  );
}
