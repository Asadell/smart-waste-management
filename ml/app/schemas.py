from pydantic import BaseModel, Field


class Prediction(BaseModel):
    label: str = Field(examples=["plastic"])
    confidence: float = Field(ge=0, le=1, examples=[0.94])
    uncertain: bool = Field(description="True bila confidence di bawah threshold; client sebaiknya meminta user memilih kategori.")
    probabilities: dict[str, float] = Field(examples=[{"organic": 0.02, "paper": 0.04, "plastic": 0.94}])


class Health(BaseModel):
    status: str
    model_loaded: bool
    model_version: str
    classes: list[str]


class ClassList(BaseModel):
    classes: list[str]
