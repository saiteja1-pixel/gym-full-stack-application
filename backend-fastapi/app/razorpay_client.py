import razorpay
from app.config import settings

# Initialize Razorpay Client instance with Key ID and Key Secret
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
