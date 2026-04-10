# algo_proj
to run this, have two separate terminal

## terminal #1: 
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload

## terminal #2:
cd frontend
npm install
npm run dev
