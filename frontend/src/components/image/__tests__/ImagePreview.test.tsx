import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagePreview } from '../ImagePreview';
import { ImageResponse } from '../../../services/imageService';

// Mock UI components
jest.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${variant} ${size} ${className}`}
    >
      {children}
    </button>
  ),
}));

jest.mock('../../ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('ImagePreview', () => {
  const mockImage: ImageResponse = {
    id: 'img-123',
    imageUrl: 'https://example.com/image.png',
    prompt: 'A beautiful sunset over mountains',
    status: 'completed',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    metadata: {
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
      revisedPrompt: 'A beautiful sunset over mountains with enhanced details',
      type: 'generation',
    },
  };

  const mockHandlers = {
    onDownload: jest.fn(),
    onRegenerate: jest.fn(),
    onDelete: jest.fn(),
    onShare: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render image preview with all information', () => {
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    expect(screen.getByAltText(mockImage.prompt)).toBeInTheDocument();
    expect(screen.getByText(mockImage.prompt)).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('模型: dall-e-3')).toBeInTheDocument();
    expect(screen.getByText('尺寸: 1024x1024')).toBeInTheDocument();
    expect(screen.getByText('品質: standard')).toBeInTheDocument();
    expect(screen.getByText('風格: vivid')).toBeInTheDocument();
  });

  it('should show revised prompt when available', () => {
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    expect(screen.getByText('AI修訂提示詞:')).toBeInTheDocument();
    expect(screen.getByText('A beautiful sunset over mountains with enhanced details')).toBeInTheDocument();
  });

  it('should not show revised prompt when same as original', () => {
    const imageWithSamePrompt = {
      ...mockImage,
      metadata: {
        ...mockImage.metadata,
        revisedPrompt: mockImage.prompt,
      },
    };

    render(<ImagePreview image={imageWithSamePrompt} {...mockHandlers} />);

    expect(screen.queryByText('AI修訂提示詞:')).not.toBeInTheDocument();
  });

  it('should handle image loading states', () => {
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    const image = screen.getByAltText(mockImage.prompt);
    
    // Simulate image loading
    fireEvent.load(image);
    
    // Should not show loading spinner after load
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should handle image error state', () => {
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    const image = screen.getByAltText(mockImage.prompt);
    
    // Simulate image error
    fireEvent.error(image);
    
    expect(screen.getByText('圖片載入失敗')).toBeInTheDocument();
  });

  it('should call onDownload when download button is clicked', async () => {
    const user = userEvent.setup();
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    const downloadButton = screen.getByText('下載');
    await user.click(downloadButton);

    expect(mockHandlers.onDownload).toHaveBeenCalledTimes(1);
  });

  it('should call onRegenerate when regenerate button is clicked', async () => {
    const user = userEvent.setup();
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    const regenerateButton = screen.getByText('重新生成');
    await user.click(regenerateButton);

    expect(mockHandlers.onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    const deleteButton = screen.getByRole('button', { name: '' }); // SVG button
    await user.click(deleteButton);

    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should copy image URL to clipboard', async () => {
    const user = userEvent.setup();
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    const copyButton = screen.getByText('複製連結');
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockImage.imageUrl);
    
    await waitFor(() => {
      expect(screen.getByText('已複製')).toBeInTheDocument();
    });

    // Should revert back to original text after timeout
    await waitFor(() => {
      expect(screen.getByText('複製連結')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should copy prompt to clipboard', async () => {
    const user = userEvent.setup();
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    const copyPromptButton = screen.getByText('複製');
    await user.click(copyPromptButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockImage.prompt);
  });

  it('should open fullscreen view when image is clicked', async () => {
    const user = userEvent.setup();
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    const image = screen.getByAltText(mockImage.prompt);
    await user.click(image);

    // Should show fullscreen overlay
    expect(screen.getAllByAltText(mockImage.prompt)).toHaveLength(2); // Original + fullscreen
  });

  it('should close fullscreen view when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    // Open fullscreen
    const image = screen.getByAltText(mockImage.prompt);
    await user.click(image);

    // Close fullscreen
    const closeButton = screen.getByRole('button', { name: '' }); // Close SVG button
    await user.click(closeButton);

    // Should only have one image (not fullscreen)
    expect(screen.getAllByAltText(mockImage.prompt)).toHaveLength(1);
  });

  it('should show different status colors and text', () => {
    const pendingImage = { ...mockImage, status: 'pending' as const };
    const failedImage = { ...mockImage, status: 'failed' as const };

    const { rerender } = render(<ImagePreview image={pendingImage} {...mockHandlers} />);
    expect(screen.getByText('生成中')).toBeInTheDocument();

    rerender(<ImagePreview image={failedImage} {...mockHandlers} />);
    expect(screen.getByText('失敗')).toBeInTheDocument();
  });

  it('should format creation time correctly', () => {
    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    // Should show formatted date
    expect(screen.getByText(/生成時間:/)).toBeInTheDocument();
  });

  it('should hide actions when showActions is false', () => {
    render(<ImagePreview image={mockImage} showActions={false} {...mockHandlers} />);

    expect(screen.queryByText('下載')).not.toBeInTheDocument();
    expect(screen.queryByText('重新生成')).not.toBeInTheDocument();
  });

  it('should handle missing metadata gracefully', () => {
    const imageWithoutMetadata = {
      ...mockImage,
      metadata: undefined,
    };

    render(<ImagePreview image={imageWithoutMetadata} {...mockHandlers} />);

    // Should still render without errors
    expect(screen.getByAltText(mockImage.prompt)).toBeInTheDocument();
    expect(screen.queryByText('模型:')).not.toBeInTheDocument();
  });

  it('should handle partial metadata', () => {
    const imageWithPartialMetadata = {
      ...mockImage,
      metadata: {
        model: 'dall-e-3',
        // Missing other fields
      },
    };

    render(<ImagePreview image={imageWithPartialMetadata} {...mockHandlers} />);

    expect(screen.getByText('模型: dall-e-3')).toBeInTheDocument();
    expect(screen.queryByText('尺寸:')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ImagePreview image={mockImage} className="custom-class" {...mockHandlers} />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle clipboard API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock clipboard API to throw error
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));
    
    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<ImagePreview image={mockImage} {...mockHandlers} />);

    const copyButton = screen.getByText('複製連結');
    await user.click(copyButton);

    expect(consoleSpy).toHaveBeenCalledWith('複製失敗:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });
});