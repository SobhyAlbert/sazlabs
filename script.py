import numpy as np
from PIL import Image

img = Image.open('assets/logo_horizontal.png').convert('RGB')
arr = np.array(img).astype(np.float32) / 255.0

r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
alpha = np.maximum.reduce([r, g, b])

out = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.float32)
mask = alpha > 0
out[mask, 0] = r[mask] / alpha[mask]
out[mask, 1] = g[mask] / alpha[mask]
out[mask, 2] = b[mask] / alpha[mask]
out[:,:,3] = alpha

out = (out * 255).clip(0, 255).astype(np.uint8)
Image.fromarray(out).save('assets/logo_horizontal_transparent.png')
