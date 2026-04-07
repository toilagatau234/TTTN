import React, { useState } from "react";
import "./MiniGame.css";
import { flowers, papers, bows, cards } from "./minigameData";

const MiniGame = () => {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedBow, setSelectedBow] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [paperWrapped, setPaperWrapped] = useState(false);
  const [bouquetFlowers, setBouquetFlowers] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [score, setScore] = useState(0);

  const toolIcons = {
    paper: "https://res.cloudinary.com/drwles2k0/image/upload/v1774451284/O_Maior_pintor_do_mundo-removebg-preview_wnqfep.png",
    bow: "https://res.cloudinary.com/drwles2k0/image/upload/v1774451636/Download_free_image_of_Pastel_coquette_bow_ribbon_tie_accessories_accessory__by_Ning_about_elegant_pastel_ribbon_bow_illustration__watercolor_blue_pink_bow__watercolor__bow__and_illustration_15151402__ga0eqy.png",
    card: "https://res.cloudinary.com/drwles2k0/image/upload/v1774451642/Download_premium_png_of_PNG_Elegant_floral_pink_invitation_by_Kappy_about_coquette__envelope_flower_coquette__pink_coquette__coquette_flower__and_watercolor_birthday_invitation_15247206-removebg-previ_hic9pi.png",
    wrap: "https://res.cloudinary.com/drwles2k0/image/upload/v1774451908/flower_bunch_ribbin_hd_png-removebg-preview_kcyjzd.png",
    trash: "https://res.cloudinary.com/drwles2k0/image/upload/v1774452048/X_custom_app_icon_xg9nv0.jpg",
    complete: "https://res.cloudinary.com/drwles2k0/image/upload/v1774455881/Tasks_pink_App_Icon_lenhqg.jpg",
  };

  // Kích thước & vị trí giấy mở (ảnh nền giấy để cắm hoa)
  const paperOpenStyle = {
    width: 430,
    height: 430,
    left: 50, // %
    bottom: 35, // px
  };

  // Kích thước & vị trí giấy đè lên khi bấm "Gói giấy"
  const paperWrappedStyle = selectedPaper?.wrappedStyle || {
    width: 325,
    height: 350,
    left: 49,
    bottom: -10,
  };
  // Vị trí thiệp
  const [cardPosition, setCardPosition] = useState({ x: 520, y: 120 });

  // Vị trí nơ
  const [bowPosition, setBowPosition] = useState({ x: 255, y: 400 });

  // Kéo hoa bắt đầu
  const handleDragStart = (e, flower) => {
    e.dataTransfer.setData("flower", JSON.stringify(flower));
    e.dataTransfer.setData("type", "flower");
  };

  // Kéo nơ bắt đầu
  const handleBowDragStart = (e, bow) => {
    e.dataTransfer.setData("bow", JSON.stringify(bow));
    e.dataTransfer.setData("type", "bow");
  };

  // Kéo thiệp bắt đầu
  const handleCardDragStart = (e, card) => {
    e.dataTransfer.setData("card", JSON.stringify(card));
    e.dataTransfer.setData("type", "card");
  };

  // Cho phép thả vào khu vực bouquet
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Thả item vào vùng bó hoa (hoa / nơ / thiệp)
  const handleDropFlower = (e) => {
    e.preventDefault();

    const type = e.dataTransfer.getData("type");
    const dropZoneRect = e.currentTarget.getBoundingClientRect();

    const rawX = e.clientX - dropZoneRect.left - 60;
    const rawY = e.clientY - dropZoneRect.top - 80;

    // ===== THẢ THIỆP =====
    if (type === "card") {
      if (!selectedPaper) {
        alert("Chọn giấy gói trước đã nhé!");
        return;
      }

      const cardData = e.dataTransfer.getData("card");
      if (!cardData) return;

      const card = JSON.parse(cardData);

      setSelectedCard(card);
      setCardPosition({
        x: Math.max(0, Math.min(rawX, 560)),
        y: Math.max(0, Math.min(rawY, 460)),
      });
      return;
    }

    // ===== THẢ HOA =====
    if (type === "flower") {
      if (!selectedPaper) {
        alert("Vui lòng chọn giấy gói trước khi cắm hoa!");
        return;
      }

      if (paperWrapped) {
        alert("Bó hoa đã gói rồi, hãy làm lại nếu muốn thêm hoa!");
        return;
      }

      if (bouquetFlowers.length >= 10) {
        alert("Chỉ được tối đa 10 bông hoa!");
        return;
      }

      const flowerData = e.dataTransfer.getData("flower");
      if (!flowerData) return;

      const flower = JSON.parse(flowerData);

      const newFlower = {
        ...flower,
        uniqueId: Date.now() + Math.random(),
        x: Math.max(0, Math.min(rawX, 620)),
        y: Math.max(0, Math.min(rawY, 420)),
      };

      setBouquetFlowers((prev) => [...prev, newFlower]);
      return;
    }

    // ===== THẢ NƠ =====
    if (type === "bow") {
      if (!selectedPaper) {
        alert("Chọn giấy gói trước đã nhé!");
        return;
      }

      const bowData = e.dataTransfer.getData("bow");
      if (!bowData) return;

      const bow = JSON.parse(bowData);

      setSelectedBow(bow);
      setBowPosition({
        x: Math.max(0, Math.min(rawX, 520)),
        y: Math.max(0, Math.min(rawY, 470)),
      });
    }
  };

  // Chọn giấy
  const handleSelectPaper = (paper) => {
    setSelectedPaper(paper);
    setPaperWrapped(false);
    setActivePanel(null);
  };

  // Gói giấy
  const handleWrapPaper = () => {
    if (!selectedPaper) {
      alert("Vui lòng chọn giấy gói trước!");
      return;
    }

    if (bouquetFlowers.length < 2) {
      alert("Hãy thêm ít nhất 2 bông hoa để gói!");
      return;
    }

    setPaperWrapped(true);
  };

  // Hoàn thành
  const calculateBouquetScore = () => {
  let total = 0;

  // 1. Điểm số lượng hoa
  const flowerCount = bouquetFlowers.length;
  if (flowerCount >= 5 && flowerCount <= 8) {
    total += 30; // đẹp nhất
  } else if (flowerCount >= 2 && flowerCount <= 4) {
    total += 20;
  } else if (flowerCount >= 9 && flowerCount <= 10) {
    total += 15;
  }

  // 2. Điểm đa dạng loại hoa
  const uniqueFlowerTypes = new Set(bouquetFlowers.map((f) => f.name)).size;
  if (uniqueFlowerTypes >= 4) {
    total += 25;
  } else if (uniqueFlowerTypes >= 2) {
    total += 15;
  } else {
    total += 5;
  }

  // 3. Có nơ
  if (selectedBow) {
    total += 20;
  }

  // 4. Có thiệp
  if (selectedCard) {
    total += 15;
  }

  // 5. Đã gói giấy
  if (paperWrapped) {
    total += 10;
  }

  // 6. Trừ điểm nếu trùng quá nhiều 1 loại hoa
  const flowerMap = {};
  bouquetFlowers.forEach((f) => {
    flowerMap[f.name] = (flowerMap[f.name] || 0) + 1;
  });

  const hasTooManySameFlower = Object.values(flowerMap).some((count) => count >= 5);
  if (hasTooManySameFlower) {
    total -= 10;
  }

  // Giới hạn tối đa 100
  if (total > 100) total = 100;
  if (total < 0) total = 0;

  return total;
};

const handleComplete = () => {
  if (!selectedPaper) {
    alert("Bạn chưa chọn giấy gói!");
    return;
  }

  if (bouquetFlowers.length < 2) {
    alert("Bó hoa cần ít nhất 2 bông!");
    return;
  }

  if (!paperWrapped) {
    alert("Hãy bấm 'Gói giấy' trước khi hoàn thành!");
    return;
  }

  if (!selectedBow) {
    alert("Bạn chưa thêm nơ cho bó hoa!");
    return;
  }

  if (!selectedCard) {
    alert("Bạn chưa thêm thiệp cho bó hoa!");
    return;
  }

  const finalScore = calculateBouquetScore();

  setCompletedCount((prev) => prev + 1);
  setScore((prev) => prev + finalScore);

  alert(`🎉 Bạn đã hoàn thành bó hoa xinh xắn!\nĐiểm bó hoa này: ${finalScore}`);
};

  // Làm lại
  const handleReset = () => {
    setSelectedPaper(null);
    setSelectedBow(null);
    setSelectedCard(null);
    setPaperWrapped(false);
    setBouquetFlowers([]);
    setActivePanel(null);
    setBowPosition({ x: 255, y: 400 });
    setCardPosition({ x: 520, y: 120 });
  };

  // Xóa bông cuối cùng
  const handleRemoveLastFlower = () => {
    setBouquetFlowers((prev) => prev.slice(0, -1));
  };

  return (
    <div className="minigame-container">
      {/* Thanh trên */}
      <div className="minigame-header">
        <div className="header-left">
          <h2>Tự Tay Gói Những Bó Hoa Xinh</h2>
        </div>

        <div className="header-center">
          <span>
            <img
              src="https://res.cloudinary.com/drwles2k0/image/upload/v1774455691/t%E1%BA%A3i_xu%E1%BB%91ng__26_-removebg-preview_oec7dl.png"
              alt="hoa"
              className="header-icon"
            />
            Hoa đã chọn: {bouquetFlowers.length}/10
          </span>

          <span>
            <img
              src="https://res.cloudinary.com/drwles2k0/image/upload/v1774455591/Post_from_Makeup_Kh%C3%B4ng_Kh%C3%B3-removebg-preview_gbaezw.png"
              alt="bo hoa"
              className="header-icon"
            />
            Đã hoàn thành: {completedCount}
          </span>

          <span>
            <img
              src="https://res.cloudinary.com/drwles2k0/image/upload/v1774455755/t%E1%BA%A3i_xu%E1%BB%91ng__27_-removebg-preview_dt0lqa.png"
              alt="diem"
              className="header-icon"
            />
            Điểm: {score}
          </span>
        </div>

        <div className="header-right">
          <button onClick={handleReset}>Làm lại</button>
          <button className="complete-btn" onClick={handleComplete}>
            Hoàn thành
          </button>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="minigame-body">
        {/* Cột trái - Bình hoa */}
        <div className="flower-shelf">
          <h3>Bình hoa</h3>
          <div className="flower-list">
            {flowers.map((flower) => (
              <div
                key={flower.id}
                className="flower-item"
                draggable
                onDragStart={(e) => handleDragStart(e, flower)}
              >
                <img src={flower.image} alt={flower.name} />
                <span>{flower.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Khu vực giữa - Gói bó hoa */}
        <div className="bouquet-area-wrapper">
          <div
            className="bouquet-drop-zone"
            onDragOver={handleDragOver}
            onDrop={handleDropFlower}
          >
            {!selectedPaper && (
              <div className="drop-placeholder">
                Hãy chọn giấy gói hoa trước, sau đó thao tác kéo hoa vào khung nhé ✿
              </div>
            )}

            {/* Giấy mở nằm dưới */}
            {selectedPaper && (
              <img
                className="paper-base"
                src={selectedPaper.openImage}
                alt="paper open"
                style={{
                  width: `${paperOpenStyle.width}px`,
                  height: `${paperOpenStyle.height}px`,
                  left: `${paperOpenStyle.left}%`,
                  bottom: `${paperOpenStyle.bottom}px`,
                }}
              />
            )}

            {/* Hoa */}
            {bouquetFlowers.map((flower) => (
              <img
                key={flower.uniqueId}
                src={flower.image}
                alt={flower.name}
                className="bouquet-flower"
                style={{
                  left: `${flower.x}px`,
                  top: `${flower.y}px`,
                }}
              />
            ))}

            {/* Thiệp */}
            {selectedCard && (
              <img
                src={selectedCard.image}
                alt={selectedCard.name}
                className="bouquet-card"
                style={{
                  left: `${cardPosition.x}px`,
                  top: `${cardPosition.y}px`,
                }}
              />
            )}

            {/* Nơ */}
            {selectedBow && (
              <img
                src={selectedBow.image}
                alt={selectedBow.name}
                className="bouquet-bow"
                style={{
                  left: `${bowPosition.x}px`,
                  top: `${bowPosition.y}px`,
                }}
              />
            )}

            {/* Ảnh giấy gói sẵn CHỒNG LÊN TRÊN khi bấm gói */}
            {selectedPaper && paperWrapped && (
              <img
                className="paper-overlay"
                src={selectedPaper.wrappedImage}
                alt="paper wrapped"
                style={{
                  width: `${paperWrappedStyle.width}px`,
                  height: `${paperWrappedStyle.height}px`,
                  left: `${paperWrappedStyle.left}%`,
                  bottom: `${paperWrappedStyle.bottom}px`,
                }}
              />
            )}
          </div>
        </div>

        {/* Cột phải - Tools */}
        <div className="tool-panel">
          <button
            className="tool-btn"
            onClick={() => setActivePanel(activePanel === "paper" ? null : "paper")}
          >
            <img src={toolIcons.paper} alt="Chọn giấy" />
          </button>

          <button
            className="tool-btn"
            onClick={() => setActivePanel(activePanel === "bow" ? null : "bow")}
          >
            <img src={toolIcons.bow} alt="Chọn nơ" />
          </button>

          <button
            className="tool-btn"
            onClick={() => setActivePanel(activePanel === "card" ? null : "card")}
          >
            <img src={toolIcons.card} alt="Chọn thiệp" />
          </button>

          <button className="tool-btn" onClick={handleWrapPaper}>
            <img src={toolIcons.wrap} alt="Gói giấy" />
          </button>

          <button className="tool-btn" onClick={handleRemoveLastFlower}>
            <img src={toolIcons.trash} alt="Xóa hoa" />
          </button>

          <button className="tool-btn success" onClick={handleComplete}>
            <img src={toolIcons.complete} alt="Hoàn thành" />
          </button>
        </div>
      </div>

      {/* Panel chọn giấy */}
      {activePanel === "paper" && (
        <div className="selection-panel">
          <h4>Chọn giấy gói cho bó hoa ✿</h4>
          <div className="selection-grid">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="paper-option"
                onClick={() => handleSelectPaper(paper)}
              >
                <img
                  src={paper.preview}
                  alt={paper.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "12px",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel chọn nơ */}
      {activePanel === "bow" && (
        <div className="selection-panel">
          <h4>Chọn nơ trang trí cho bó hoa nhé ✿</h4>
          <div className="selection-grid">
            {bows.map((bow) => (
              <div
                key={bow.id}
                className="bow-option"
                draggable
                onDragStart={(e) => handleBowDragStart(e, bow)}
              >
                <img
                  src={bow.image}
                  alt={bow.name}
                  style={{ width: "48px", height: "48px", objectFit: "contain" }}
                />
                <span>{bow.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel chọn thiệp */}
      {activePanel === "card" && (
        <div className="selection-panel">
          <h4>Chọn hình yêu thích và kéo thả cho bó hoa ✿</h4>
          <div className="selection-grid">
            {cards.map((card) => (
              <div
                key={card.id}
                className="card-option"
                draggable
                onDragStart={(e) => handleCardDragStart(e, card)}
              >
                <img
                  src={card.image}
                  alt={card.name}
                  style={{ width: "100%", height: "70px", objectFit: "contain" }}
                />
                <p>{card.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniGame;