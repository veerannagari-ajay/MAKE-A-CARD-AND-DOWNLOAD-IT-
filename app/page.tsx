'use client';

import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

const Home = () => {
  const [text, setText] = useState('');
  const [cardTexts, setCardTexts] = useState<
    { id: number; text: string; position: { top: number; left: number }; scale: number }[]
  >([]); // Store multiple texts
  const [images, setImages] = useState<
    { id: number; src: string | ArrayBuffer; position: { top: number; left: number }; scale: number }[]
  >([]); // Store multiple images
  const [cardSize, setCardSize] = useState<{ width: number; height: number }>({ width: 400, height: 250 });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: number; type: 'image' | 'text' } | null>(null); // Store selected item

  const handleDownload = async () => {
    if (cardRef.current === null) {
      return;
    }
    const dataUrl = await toPng(cardRef.current);
    download(dataUrl, 'card.png');
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prevImages) => [
            ...prevImages,
            { id: prevImages.length + 1, src: reader.result!, position: { top: 0, left: 0 }, scale: 1 },
          ]);
        };
        reader.readAsDataURL(file);
      });
    } else {
      alert('Please select a valid .jpg image');
    }
  };

  const handleDeleteItem = () => {
    if (!selectedItem) return;
    if (selectedItem.type === 'image') {
      setImages((prevImages) => prevImages.filter((image) => image.id !== selectedItem.id));
    } else {
      setCardTexts((prevTexts) => prevTexts.filter((text) => text.id !== selectedItem.id));
    }
    setSelectedItem(null);
  };

  const handleTextConfirm = () => {
    if (text.trim() === '') return; // Prevent empty text
    setCardTexts((prevTexts) => [
      ...prevTexts,
      {
        id: prevTexts.length + 1,
        text,
        position: { top: 0, left: 0 },
        scale: 1,
      },
    ]);
    setText(''); // Clear the input field after confirming the text
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLImageElement | HTMLParagraphElement>,
    id: number,
    type: 'image' | 'text'
  ) => {
    event.preventDefault();

    const target = event.currentTarget as HTMLElement;
    const offsetX = event.clientX - target.getBoundingClientRect().left;
    const offsetY = event.clientY - target.getBoundingClientRect().top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const cardRect = cardRef.current?.getBoundingClientRect();
      if (cardRect) {
        const newTop = moveEvent.clientY - cardRect.top - offsetY;
        const newLeft = moveEvent.clientX - cardRect.left - offsetX;

        if (type === 'image') {
          setImages((prevImages) =>
            prevImages.map((image) =>
              image.id === id
                ? {
                    ...image,
                    position: {
                      top: Math.max(0, Math.min(newTop, cardRect.height - 100 * image.scale)),
                      left: Math.max(0, Math.min(newLeft, cardRect.width - 100 * image.scale)),
                    },
                  }
                : image
            )
          );
        } else {
          setCardTexts((prevTexts) =>
            prevTexts.map((text) =>
              text.id === id
                ? {
                    ...text,
                    position: {
                      top: Math.max(0, Math.min(newTop, cardRect.height - 20 * text.scale)),
                      left: Math.max(0, Math.min(newLeft, cardRect.width - 20 * text.scale)),
                    },
                  }
                : text
            )
          );
        }
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleZoomIn = () => {
    if (!selectedItem) return;

    if (selectedItem.type === 'image') {
      setImages((prevImages) =>
        prevImages.map((image) => (image.id === selectedItem.id ? { ...image, scale: Math.min(image.scale + 0.1, 3) } : image))
      );
    } else {
      setCardTexts((prevTexts) =>
        prevTexts.map((text) => (text.id === selectedItem.id ? { ...text, scale: Math.min(text.scale + 0.1, 3) } : text))
      );
    }
  };

  const handleZoomOut = () => {
    if (!selectedItem) return;

    if (selectedItem.type === 'image') {
      setImages((prevImages) =>
        prevImages.map((image) => (image.id === selectedItem.id ? { ...image, scale: Math.max(image.scale - 0.1, 0.5) } : image))
      );
    } else {
      setCardTexts((prevTexts) =>
        prevTexts.map((text) => (text.id === selectedItem.id ? { ...text, scale: Math.max(text.scale - 0.1, 0.5) } : text))
      );
    }
  };

  const handleCardIncrease = () => {
    setCardSize((prevSize) => ({
      width: Math.min(prevSize.width + 20, window.innerWidth - 40),
      height: Math.min(prevSize.height + 20, window.innerHeight - 40),
    }));
  };

  const handleCardDecrease = () => {
    setCardSize((prevSize) => ({
      width: Math.max(prevSize.width - 20, 100),
      height: Math.max(prevSize.height - 20, 100),
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-400 to-purple-500">
      <h1 className="text-4xl font-extrabold text-white mb-6">Create and Download Your Card</h1>

      <input
        type="text"
        placeholder="Enter your card text"
        className="p-3 mb-6 w-80 text-lg rounded-lg shadow-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button onClick={handleTextConfirm} className="px-4 py-2 mb-6 bg-green-600 text-white rounded">
        Confirm Text
      </button>

      <label className="block mb-2 text-lg font-medium text-white">Choose picture (only .jpg allowed)</label>
      <input
        type="file"
        accept="image/jpeg"
        className="mb-6 w-80 text-lg rounded-lg shadow-lg border border-gray-300 cursor-pointer"
        onChange={handleImageChange}
      />

      <div
        ref={cardRef}
        className="relative overflow-hidden mb-4"
        style={{
          width: `${cardSize.width}px`,
          height: `${cardSize.height}px`,
          backgroundImage: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
          borderRadius: '20px',
          border: '1px solid gray',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {images.map((image) => (
          <div
            key={image.id}
            className="absolute"
            style={{ top: image.position.top, left: image.position.left }}
            onClick={() => setSelectedItem({ id: image.id, type: 'image' })}
          >
            <img
              src={image.src as string}
              alt="Card Image"
              className="object-cover rounded-full mb-4 cursor-move"
              style={{
                width: `${image.scale * 100}px`,
                height: `${image.scale * 100}px`,
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, image.id, 'image')}
            />
          </div>
        ))}

        {cardTexts.map((text) => (
          <div
            key={text.id}
            className="absolute"
            style={{ top: text.position.top, left: text.position.left }}
            onClick={() => setSelectedItem({ id: text.id, type: 'text' })}
          >
            <p
              className="text-white font-bold cursor-move"
              style={{
                transform: `scale(${text.scale})`,
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, text.id, 'text')}
            >
              {text.text}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col space-y-2">
        <button onClick={handleCardIncrease} className="px-4 py-2 bg-blue-600 text-white rounded">
          Increase Card Size
        </button>
        <button onClick={handleCardDecrease} className="px-4 py-2 bg-red-600 text-white rounded">
          Decrease Card Size
        </button>
        <button onClick={handleDownload} className="px-4 py-2 bg-yellow-500 text-white rounded">
          Download Card
        </button>
      </div>

      {/* Action buttons for selected item */}
      {selectedItem && (
        <div className="flex space-x-4 mt-4">
          <button onClick={handleZoomIn} className="bg-blue-500 px-2 py-1 text-white rounded">
            Zoom In
          </button>
          <button onClick={handleZoomOut} className="bg-red-500 px-2 py-1 text-white rounded">
            Zoom Out
          </button>
          <button onClick={handleDeleteItem} className="bg-yellow-500 px-2 py-1 text-white rounded">
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
