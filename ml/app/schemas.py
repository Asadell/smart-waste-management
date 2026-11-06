from pydantic import BaseModel, Field


class Prediction(BaseModel):
    label: str = Field(
        examples=["plastic"],
        description="organic | paper | plastic | other. `other` = foto bukan salah satu dari 3 jenis sampah.",
    )
    confidence: float = Field(ge=0, le=1, examples=[0.94])
    uncertain: bool = Field(description="True bila confidence di bawah threshold; client sebaiknya meminta user memilih kategori.")
    probabilities: dict[str, float] = Field(examples=[{"organic": 0.02, "other": 0.01, "paper": 0.03, "plastic": 0.94}])


class Health(BaseModel):
    status: str
    model_loaded: bool
    model_version: str
    classes: list[str]


class ClassList(BaseModel):
    classes: list[str]
