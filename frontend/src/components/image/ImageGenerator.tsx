import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Loading } from '../ui/Loading';
import { ImageService } from '../../services/imageService';
import toast from 'react-hot-toast';

interface ImageGeneratorProps {
  onImageGenerated?: (image: { imageUrl: string; prompt: string }) => void;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const imageService = new ImageService();
      const imageUrl = await imageService.generateImage(prompt);
      setGeneratedImage(imageUrl);
      onImageGenerated?.({ imageUrl, prompt });
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Generate Image</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-2">
            Prompt
          </label>
          <Input
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
        >
          {isGenerating ? <Loading size="sm" /> : 'Generate Image'}
        </Button>

        {generatedImage && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Generated Image</h3>
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full max-w-md mx-auto rounded-lg shadow-lg"
            />
          </div>
        )}
      </div>
    </Card>
  );
};